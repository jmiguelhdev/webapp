/**
 * @file CompanyConfigApi.js
 * @description API para la gestión de la información institucional, sucursales y horarios de Frigorífico Pampa.
 * Se almacena en la colección 'system_config', documento 'company_info'.
 * @module adapters/api/CompanyConfigApi
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { _getCached, _setCached, _invalidateCached, TTL_10MIN } from './common.js';

const CACHE_KEY = 'system_config:company_info';

export const DEFAULT_PILLARS = [
  {
    id: 'faena-desposte',
    title: 'Faena & Desposte Certificado',
    description: 'Procesos sanitarios bajo estrictas normas de bioseguridad, tipificación de reses y trazabilidad integral de lotes de hacienda.',
    icon: '🥩',
    imageUrl: ''
  },
  {
    id: 'cadena-frio',
    title: 'Cadena de Frío & Acopio',
    description: 'Cámaras de maduración y conservación con monitoreo telemétrico continuo para preservar el valor cárnico y frescura.',
    icon: '❄️',
    imageUrl: ''
  },
  {
    id: 'logistica-despacho',
    title: 'Logística & Despacho',
    description: 'Coordinación de jaulas de transporte, control de mermas y rendimientos ganaderos con conexión directa a los principales mercados.',
    icon: '🚚',
    imageUrl: ''
  }
];

export const DEFAULT_COMPANY_CONFIG = {
  companyName: 'Frigorífico Pampa',
  slogan: 'Calidad, Trazabilidad y Excelencia en la Industria Cárnica',
  description: 'Instalaciones de faena, desposte y logística frigorífica de última generación. Garantizamos la máxima frescura y sanidad desde el origen ganadero hasta su mesa.',
  pillars: DEFAULT_PILLARS,
  branches: [
    {
      id: 'central',
      name: 'Planta Frigorífica Central',
      address: 'Ruta Nacional N° 5 Km 600, La Pampa',
      phone: '+54 9 2954 456789',
      email: 'contacto@frigorificopampa.tech',
      hours: 'Lunes a Viernes: 06:00 a 16:00 hs — Sábados: 07:00 a 12:00 hs',
      imageUrl: ''
    },
    {
      id: 'distribucion',
      name: 'Centro de Distribución & Logística',
      address: 'Parque Industrial, Calle 4 y 102, La Pampa',
      phone: '+54 9 2954 987654',
      email: 'logistica@frigorificopampa.tech',
      hours: 'Lunes a Viernes: 05:00 a 18:00 hs — Guardias operativas 24hs',
      imageUrl: ''
    }
  ]
};

/**
 * Obtiene la configuración institucional y de sucursales desde Firestore.
 * Si falla o está offline, retorna la configuración por defecto o en caché.
 * @param {Object} db - Instancia de Firestore.
 * @returns {Promise<typeof DEFAULT_COMPANY_CONFIG>}
 */
export async function fetchCompanyConfig(db) {
  const cached = _getCached(CACHE_KEY);
  if (cached && Array.isArray(cached.branches)) {
    return cached;
  }

  try {
    const docRef = doc(db, 'system_config', 'company_info');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() || {};
      const config = {
        companyName: data.companyName || DEFAULT_COMPANY_CONFIG.companyName,
        slogan: data.slogan || DEFAULT_COMPANY_CONFIG.slogan,
        description: data.description || DEFAULT_COMPANY_CONFIG.description,
        pillars: Array.isArray(data.pillars) && data.pillars.length > 0
          ? data.pillars
          : DEFAULT_PILLARS,
        branches: Array.isArray(data.branches) && data.branches.length > 0
          ? data.branches
          : DEFAULT_COMPANY_CONFIG.branches,
        updatedAt: data.updatedAt || null
      };
      _setCached(CACHE_KEY, config, TTL_10MIN);
      return config;
    }
  } catch (e) {
    console.warn('Advertencia al consultar system_config/company_info en Firestore:', e?.message || e);
  }

  return { ...DEFAULT_COMPANY_CONFIG };
}

/**
 * Guarda o actualiza la configuración institucional y sucursales en Firestore.
 * @param {Object} db - Instancia de Firestore.
 * @param {Object} config - Datos de configuración a persistir.
 * @param {string} userEmail - Email del usuario administrador.
 * @returns {Promise<{success: boolean}>}
 */
export async function updateCompanyConfig(db, config, userEmail = '') {
  if (!config) throw new Error('Datos de configuración requeridos.');

  const docRef = doc(db, 'system_config', 'company_info');
  const payload = {
    companyName: String(config.companyName || DEFAULT_COMPANY_CONFIG.companyName).trim(),
    slogan: String(config.slogan || DEFAULT_COMPANY_CONFIG.slogan).trim(),
    description: String(config.description || DEFAULT_COMPANY_CONFIG.description).trim(),
    pillars: Array.isArray(config.pillars) ? config.pillars : DEFAULT_PILLARS,
    branches: Array.isArray(config.branches) ? config.branches : DEFAULT_COMPANY_CONFIG.branches,
    updatedAt: Date.now(),
    updatedBy: userEmail || 'ADMIN'
  };

  await setDoc(docRef, payload, { merge: true });
  _invalidateCached(CACHE_KEY);
  return { success: true };
}
