import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import Afip from '@afipsdk/afip.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Inicialización de Afip SDK (ARCA)
const afipCuit = process.env.AFIP_CUIT ? Number(process.env.AFIP_CUIT) : 20409378472;
const afipToken = process.env.AFIP_TOKEN || 'p7R9x0sJVTXDdoBh77Rq5zYhop32tvEAHNbzEmkiZlsVlBeNj4C9837bbxnRDMKQ';
const isProduction = process.env.AFIP_PRODUCTION === 'true';

let afip;
try {
  afip = new Afip({
    CUIT: afipCuit,
    access_token: afipToken,
    production: isProduction
  });
  console.log(`[ARCA / AFIP SDK] Cliente inicializado correctamente. CUIT: ${afipCuit} | Modo Producción: ${isProduction}`);
} catch (err) {
  console.error('[ARCA / AFIP SDK] Error inicializando cliente Afip:', err.message);
}

// Matriz de Imputación Contable por Actividad CLAE
const MATRIZ_CONTABLE = {
  620100: { nombre: 'Gastos de SaaS y Cloud', codigo: '5.1.01' },
  691001: { nombre: 'Honorarios Profesionales', codigo: '5.1.08' },
  351110: { nombre: 'Servicios Públicos', codigo: '5.1.12' },
  014113: { nombre: 'Gastos Ganaderos y Cría', codigo: '5.1.02' },
  14113:  { nombre: 'Gastos Ganaderos y Cría', codigo: '5.1.02' },
  492330: { nombre: 'Fletes y Logística', codigo: '5.1.05' },
  101011: { nombre: 'Procesamiento y Faena', codigo: '5.1.06' },
  462000: { nombre: 'Compra de Hacienda e Insumos', codigo: '5.1.03' }
};

// Caché en memoria para datos de Padrón Registral (disminuir latencia y evitar rate-limit)
const padronCache = new Map();

/**
 * Normaliza las actividades devueltas por el servicio sr-padron de ARCA/AFIP.
 * Handlea la respuesta no determinista (objeto único vs array de objetos).
 */
async function getActividadesNormalizadas(cuit) {
  if (!afip) return [];
  if (padronCache.has(cuit)) {
    return padronCache.get(cuit);
  }

  try {
    const padron = await afip.getService('sr-padron').getPersona(cuit);
    const raw = padron?.datosGenerales?.actividad || padron?.datosRegimenGeneral?.actividad || [];
    const rawList = Array.isArray(raw) ? raw : [raw].filter(Boolean);
    const actividades = rawList.map(a => Number(a.idActividad || a)).filter(Boolean);

    padronCache.set(cuit, actividades);
    return actividades;
  } catch (err) {
    console.warn(`[sr-padron] No se pudo obtener padrón para CUIT ${cuit}:`, err.message);
    return [];
  }
}

// Endpoint 1: Obtener Comprobantes Recibidos (Mis Comprobantes - Tipo 'R')
app.get('/api/gastos', async (req, res) => {
  try {
    if (!afip) {
      return res.status(500).json({ success: false, error: 'Cliente AFIP SDK no inicializado' });
    }
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ success: false, error: 'Parámetros desde y hasta requeridos (YYYY-MM-DD)' });
    }

    const comprobantes = await afip.getService('mis-comprobantes').getComprobantes(desde, hasta, 'R');
    const list = Array.isArray(comprobantes) ? comprobantes : (comprobantes ? [comprobantes] : []);

    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    console.error('Error obteniendo comprobantes recibidos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint 2: Pipeline de Atribución Contable e Imputación Inteligente
app.get('/api/pipeline-atribucion', async (req, res) => {
  try {
    if (!afip) {
      return res.status(500).json({ success: false, error: 'Cliente AFIP SDK no inicializado' });
    }
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ success: false, error: 'Parámetros desde y hasta requeridos (YYYY-MM-DD)' });
    }

    let comprobantesRaw;
    try {
      comprobantesRaw = await afip.getService('mis-comprobantes').getComprobantes(desde, hasta, 'R');
    } catch (errCbte) {
      // Manejo del error o respuesta vacía de Mis Comprobantes
      comprobantesRaw = [];
    }

    const comprobantes = Array.isArray(comprobantesRaw) ? comprobantesRaw : (comprobantesRaw ? [comprobantesRaw] : []);

    const result = await Promise.all(comprobantes.map(async (cbte) => {
      const cuitEmisor = cbte.cuitEmisor || cbte.cuit || cbte.NroDocEmisor;
      let actividades = [];

      if (cuitEmisor) {
        actividades = await getActividadesNormalizadas(cuitEmisor);
      }

      // Buscar coincidencia en la matriz contable o asignar cuenta genérica
      const imputacion = actividades.map(id => MATRIZ_CONTABLE[id]).find(a => Boolean(a)) 
        || { nombre: 'Gastos Generales / A Categorizar', codigo: '5.9.99' };

      return {
        ...cbte,
        cuitEmisor,
        actividadesCLAE: actividades,
        cuentaSugerida: imputacion,
        leyendaTransparencia: 'Régimen de Transparencia Fiscal al Consumidor Ley 27.743'
      };
    }));

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error('Error en pipeline de atribución contable:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint 3: Obtener Comprobantes Emitidos (Mis Comprobantes - Tipo 'E' / Ventas)
app.get('/api/ventas-emitidas', async (req, res) => {
  try {
    if (!afip) {
      return res.status(500).json({ success: false, error: 'Cliente AFIP SDK no inicializado' });
    }
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ success: false, error: 'Parámetros desde y hasta requeridos (YYYY-MM-DD)' });
    }

    const comprobantes = await afip.getService('mis-comprobantes').getComprobantes(desde, hasta, 'E');
    const list = Array.isArray(comprobantes) ? comprobantes : (comprobantes ? [comprobantes] : []);

    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    console.error('Error obteniendo comprobantes emitidos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint 4: Pipeline de Ventas / Comprobantes Emitidos Enriquecidos
app.get('/api/pipeline-emitidos', async (req, res) => {
  try {
    if (!afip) {
      return res.status(500).json({ success: false, error: 'Cliente AFIP SDK no inicializado' });
    }
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ success: false, error: 'Parámetros desde y hasta requeridos (YYYY-MM-DD)' });
    }

    let comprobantesRaw;
    try {
      comprobantesRaw = await afip.getService('mis-comprobantes').getComprobantes(desde, hasta, 'E');
    } catch (errCbte) {
      comprobantesRaw = [];
    }

    const comprobantes = Array.isArray(comprobantesRaw) ? comprobantesRaw : (comprobantesRaw ? [comprobantesRaw] : []);

    const result = await Promise.all(comprobantes.map(async (cbte) => {
      const cuitReceptor = cbte.cuitReceptor || cbte.cuit || cbte.NroDocReceptor || cbte.cuitEmisor;
      let actividades = [];

      if (cuitReceptor) {
        actividades = await getActividadesNormalizadas(cuitReceptor);
      }

      return {
        ...cbte,
        cuitReceptor,
        razonSocialReceptor: cbte.razonSocialReceptor || cbte.razonSocial || cbte.nombreReceptor || `Cliente CUIT ${cuitReceptor || ''}`,
        actividadesCLAE: actividades,
        cuentaSugerida: { nombre: 'Ventas de Mercadería / Fletes', codigo: '4.1.01' },
        tipo: 'EMITIDO'
      };
    }));

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error('Error en pipeline de ventas emitidas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// API Endpoint for MAG Prices
app.get('/api/mag-prices', async (req, res) => {
  try {
    // Dynamic import to avoid CommonJS issues if needed, but package.json is type module
    const cheerio = await import('cheerio');
    
    // In a real production app without headless-browser proxy, you might hit Cloudflare.
    // We try to fetch from a known portal like Agrofy or De Frente Al Campo, 
    // or provide the latest known stable fallback to avoid breaking the dashboard.
    // Given the Cloudflare protections of the official MAG site, we use a structured fallback
    // that mimics the data we would parse, ensuring the UI always works.
    // You could replace `fetchUrl` with a BrightData or ScrapingBee endpoint.
    
    const magData = [
      { category: 'Novillos', min: 4200, max: 5100, avg: 4750 },
      { category: 'Novillitos', min: 4500, max: 5500, avg: 5020 },
      { category: 'Vaquillonas', min: 4000, max: 5300, avg: 4650 },
      { category: 'Vacas', min: 2000, max: 3500, avg: 2750 },
    ];
    
    // Simulate network delay to test loading states
    setTimeout(() => {
        res.json({ success: true, timestamp: Date.now(), source: 'MAG (Mock/Fallback)', data: magData });
    }, 800);

  } catch (error) {
    console.error("Error fetching MAG prices:", error);
    res.status(500).json({ success: false, error: 'Hubo un error obteniendo los precios MAG' });
  }
});

// Support SPA routing (redirect all non-file requests to index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving project from: ${path.join(__dirname, 'dist')}`);
});
