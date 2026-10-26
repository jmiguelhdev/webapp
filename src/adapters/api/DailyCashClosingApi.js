/**
 * @file DailyCashClosingApi.js
 * @description API de acceso a Cloud Firestore para la colección enriquecida 'daily_cash_closings' y sus subcolecciones bajo demanda (lazy-loading).
 * @module adapters/api/DailyCashClosingApi
 */
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * Obtiene los documentos raíz de cierres de caja en un rango de fechas.
 * Solo lee los documentos principales sin descargar subcolecciones para ahorrar lecturas de Firestore.
 *
 * @param {Object} db - Instancia de Firestore.
 * @param {number} startMs - Timestamp epoch (ms) de inicio.
 * @param {number} endMs - Timestamp epoch (ms) de fin.
 * @param {string} [butcheryName='ALL'] - Nombre de la sucursal o 'ALL' para todas.
 * @returns {Promise<Array<Object>>} Lista de documentos DailyCashClosingDto.
 */
export async function fetchClosingsByDateRange(db, startMs, endMs, butcheryName = 'ALL') {
  const closingsRef = collection(db, 'daily_cash_closings');
  const results = [];

  try {
    let q;
    if (startMs && endMs) {
      q = query(
        closingsRef,
        where('closedAt', '>=', startMs),
        where('closedAt', '<=', endMs),
        orderBy('closedAt', 'desc'),
        limit(1000)
      );
    } else {
      q = query(closingsRef, orderBy('closedAt', 'desc'), limit(1000));
    }

    const snapshot = await getDocs(q);
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const docItem = {
        ...data,
        closingId: data.closingId || docSnap.id,
        _isRootDoc: true
      };

      if (butcheryName && butcheryName !== 'ALL') {
        const docBranch = String(docItem.butcheryName || '').trim().toLowerCase();
        const targetBranch = String(butcheryName).trim().toLowerCase();
        if (docBranch === targetBranch) {
          results.push(docItem);
        }
      } else {
        results.push(docItem);
      }
    });
  } catch (err) {
    console.warn('[DailyCashClosingApi] Fallback query para daily_cash_closings:', err.message);
    // Fallback sin índices compuestos por si aún se están construyendo en Firebase
    const fallbackSnap = await getDocs(query(closingsRef, limit(1000)));
    fallbackSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const closedAt = Number(data.closedAt || data.openedAt || 0);
      if (startMs && closedAt < startMs) return;
      if (endMs && closedAt > endMs) return;

      const docItem = {
        ...data,
        closingId: data.closingId || docSnap.id,
        _isRootDoc: true
      };

      if (butcheryName && butcheryName !== 'ALL') {
        const docBranch = String(docItem.butcheryName || '').trim().toLowerCase();
        const targetBranch = String(butcheryName).trim().toLowerCase();
        if (docBranch !== targetBranch) return;
      }
      results.push(docItem);
    });

    results.sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  }

  return results;
}

/**
 * Descarga una subcolección específica de un cierre de caja a petición (lazy-load).
 * Subcolecciones válidas: 'sales_by_cut', 'extractions', 'account_sales', 'collections', 'raw_materials'.
 *
 * @param {Object} db - Instancia de Firestore.
 * @param {string} closingId - ID de la sesión de cierre (ej. SESSION_...).
 * @param {string} subcollectionName - Nombre de la subcolección.
 * @returns {Promise<Array<Object>>} Documentos de la subcolección.
 */
export async function fetchClosingSubcollection(db, closingId, subcollectionName) {
  if (!closingId || !subcollectionName) return [];

  try {
    const subRef = collection(db, `daily_cash_closings/${closingId}/${subcollectionName}`);
    const snapshot = await getDocs(subRef);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  } catch (err) {
    console.error(`[DailyCashClosingApi] Error descargando ${subcollectionName} de ${closingId}:`, err);
    return [];
  }
}

/**
 * Descarga bajo demanda una subcolección para múltiples sesiones (ej. todas las PCs de una sucursal en un día)
 * y etiqueta cada registro con el closingId y sourceDeviceId de origen.
 *
 * @param {Object} db - Instancia de Firestore.
 * @param {Array<Object>} sessions - Lista de sesiones raíz [{ closingId, sourceDeviceId, operatorEmail, closingType }].
 * @param {string} subcollectionName - Nombre de la subcolección a consultar.
 * @returns {Promise<Array<Object>>} Lista unificada de registros con metadatos de terminal.
 */
export async function fetchSubcollectionForMultipleSessions(db, sessions, subcollectionName) {
  if (!Array.isArray(sessions) || sessions.length === 0) return [];

  // Deduplicar por closingId para no consultar dos veces el mismo documento raíz
  const seenIds = new Set();
  const uniqueSessions = sessions.filter(s => {
    const cId = s.closingId || s.sessionId || s.id;
    if (!cId || seenIds.has(cId)) return false;
    seenIds.add(cId);
    return true;
  });

  const promises = uniqueSessions.map(async (session) => {
    const cId = session.closingId || session.sessionId || session.id;
    const assignedPc = session._assignedTerminalId || (session.sourceDeviceId && String(session.sourceDeviceId).trim()) || 'PC 1';
    const items = await fetchClosingSubcollection(db, cId, subcollectionName);
    return items.map(item => ({
      ...item,
      _closingId: cId,
      _sourceDeviceId: assignedPc,
      _shiftLabel: session._shiftLabel || `${assignedPc} (${session.closingType || 'GENERAL'})`,
      _operatorEmail: session.operatorEmail || '',
      _closingType: session.closingType || 'GENERAL'
    }));
  });

  const nestedResults = await Promise.all(promises);
  return nestedResults.flat();
}

/**
 * Consulta a petición los comprobantes fiscales emitidos en un rango horario,
 * permitiendo agrupar y auditar por Punto de Venta ARCA sin consumir lecturas en la carga inicial.
 *
 * @param {Object} db - Instancia de Firestore.
 * @param {number} startMs - Inicio del día (ms).
 * @param {number} endMs - Fin del día (ms).
 * @param {string} [butcheryName='ALL'] - Nombre de la carnicería.
 * @returns {Promise<Array<Object>>} Comprobantes fiscales del período.
 */
export async function fetchFiscalVouchersByDateOnDemand(db, startMs, endMs, butcheryName = 'ALL') {
  try {
    const invoicesRef = collection(db, 'fiscal_invoices');
    let q;
    try {
      q = query(
        invoicesRef,
        where('updatedAt', '>=', startMs),
        where('updatedAt', '<=', endMs),
        orderBy('updatedAt', 'desc')
      );
    } catch (_) {
      q = query(invoicesRef, limit(300));
    }

    const snapshot = await getDocs(q);
    const list = [];

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const ts = Number(data.fechaEmision || data.date || data.updatedAt || 0);
      if (startMs && ts < startMs) return;
      if (endMs && ts > endMs) return;

      if (butcheryName && butcheryName !== 'ALL') {
        const invBranch = String(data.butcheryName || '').trim().toLowerCase();
        const targetBranch = String(butcheryName).trim().toLowerCase();
        if (invBranch && invBranch !== targetBranch) return;
      }

      list.push({
        id: docSnap.id,
        ...data
      });
    });

    return list;
  } catch (err) {
    console.error('[DailyCashClosingApi] Error consultando comprobantes por punto de venta a petición:', err);
    return [];
  }
}
