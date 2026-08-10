/**
 * @file FiscalInvoiceApi.js
 * @description Servicio API para consultar comprobantes fiscales de ARCA ('fiscal_invoices') y sintetizar transacciones de ventas ('transactions').
 * @module adapters/api/FiscalInvoiceApi
 */
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import * as clientApi from './ClientApi.js';

/**
 * Obtiene comprobantes fiscales desde Firestore 'fiscal_invoices' y 'transactions'.
 * @param {Object} db - Instancia de Firestore.
 * @returns {Promise<Array<Object>>} Lista unificada de comprobantes fiscales.
 */
export async function fetchFiscalInvoices(db) {
  const resultInvoices = [];
  const invoiceIds = new Set();

  // 1. Intentar consultar colecciones 'fiscal_invoices' en Firestore
  try {
    const invoicesRef = collection(db, 'fiscal_invoices');
    let q;
    try {
      q = query(invoicesRef, orderBy('updatedAt', 'desc'), limit(500));
    } catch (e) {
      q = query(invoicesRef, limit(500));
    }
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      invoiceIds.add(id);
      resultInvoices.push({ id, ...data });
    });
  } catch (err) {
    console.warn('[FiscalInvoiceApi] Nota: No se pudo consultar fiscal_invoices de Firestore:', err.message);
  }

  // 2. Consultar clientes para resolver nombres de receptores
  let clientsMap = {};
  try {
    const clients = await clientApi.fetchClients(db);
    clientsMap = clients.reduce((acc, c) => {
      if (c.id) acc[c.id] = c;
      return acc;
    }, {});
  } catch (e) {
    console.warn('[FiscalInvoiceApi] Error al obtener clientes:', e.message);
  }

  // 3. Consultar transacciones de ventas ('transactions') para construir comprobantes si fiscal_invoices está vacío
  try {
    const rawTxs = await clientApi.fetchAllTransactions(db);
    rawTxs.forEach((tx, idx) => {
      const concept = String(tx.concept || tx.description || tx.type || '').toUpperCase();
      const amount = Math.abs(Number(tx.amount || tx.total || 0));
      if (amount === 0) return;

      // Identificar si la transacción representa una venta/comprobante
      const isDebt = tx.type === 'DEBT' || concept.includes('VENTA') || concept.includes('DESPACHO') || concept.includes('FACTURA') || concept.includes('SALE_') || concept.includes('RETAIL_');
      const isNC = tx.type === 'CREDIT_NOTE' || concept.includes('NOTA DE CRÉDITO') || concept.includes('NC');
      const isND = tx.type === 'DEBIT_NOTE' || concept.includes('NOTA DE DÉBITO') || concept.includes('ND');

      if (!isDebt && !isNC && !isND) return;

      const txId = `TX_${tx.id || idx}`;
      if (invoiceIds.has(txId)) return;

      // Determinar cliente
      const clientObj = clientsMap[tx.entityId || tx.clientId || tx.customerId];
      const nombreReceptor = tx.nombreReceptor || tx.clientName || (clientObj ? clientObj.name : null) || tx.consumerName || 'Consumidor Final';
      const nroDocReceptor = tx.nroDocReceptor || (clientObj ? (clientObj.cuit || clientObj.dni) : 0) || 0;

      // Determinar tipo comprobante ARCA
      let cbteTipo = 6; // Factura B por defecto
      if (isNC) {
        cbteTipo = (clientObj && clientObj.cuit) ? 3 : 8; // NC A o NC B
      } else if (isND) {
        cbteTipo = (clientObj && clientObj.cuit) ? 2 : 7; // ND A o ND B
      } else if (clientObj && clientObj.cuit) {
        cbteTipo = 1; // Factura A
      }

      // Extraer número correlativo del concepto si existe
      let nro = idx + 1;
      const matchNro = concept.match(/(?:N°|NRO|#)\s*([0-9]+)/i);
      if (matchNro && matchNro[1]) {
        nro = parseInt(matchNro[1], 10);
      }

      const dateMs = tx.date || tx.createdAt || tx.timestamp || Date.now();
      const dateIso = new Date(dateMs).toISOString().substring(0, 10).replace(/-/g, '');

      const neto = Math.round((amount / 1.21) * 100) / 100;
      const iva = Math.round((amount - neto) * 100) / 100;

      resultInvoices.push({
        id: txId,
        saleId: tx.saleId || (concept.includes('SALE_') ? 'SALE_' + concept.split('SALE_')[1].split(' ')[0] : `SALE_${tx.id}`),
        tipoComprobante: tx.tipoComprobante || cbteTipo,
        puntoVenta: tx.puntoVenta || 1,
        numeroComprobante: tx.numeroComprobante || nro,
        fechaEmision: tx.fechaEmision || dateIso,
        concepto: 1,
        tipoDocReceptor: nroDocReceptor ? 80 : 99,
        nroDocReceptor: nroDocReceptor,
        nombreReceptor: nombreReceptor,
        importeTotal: amount,
        importeNetoGravado: tx.importeNetoGravado || neto,
        importeIva: tx.importeIva || iva,
        cae: tx.cae || null,
        caeVencimiento: tx.caeVencimiento || null,
        storeId: tx.storeId || 'Sucursal Centro',
        updatedAt: dateMs,
        items: tx.items || [
          {
            id: `ITEM_${tx.id}`,
            codigo: 'PROD-01',
            descripcion: concept || 'Despacho de Mercadería',
            cantidad: tx.weight || 1,
            unidadMedida: tx.weight ? 7 : 1,
            precioUnitario: tx.pricePerKg || amount,
            subtotal: amount,
            codigoIva: 5,
            importeIva: iva
          }
        ],
        vats: [
          {
            codigoIva: 5,
            baseImponible: neto,
            importeIva: iva
          }
        ]
      });
    });
  } catch (errTx) {
    console.warn('[FiscalInvoiceApi] Error al sintetizar comprobantes desde transactions:', errTx.message);
  }

  // Ordenar por fecha descendente
  return resultInvoices.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
