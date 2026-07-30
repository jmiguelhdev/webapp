/**
 * @file CashExtractionApi.js
 * @description API para la gestión de retiros de efectivo de carnicerías (cash_extractions) en Firestore e IndexedDB.
 * @module adapters/api/CashExtractionApi
 */
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { localDb } from '../../frameworks/db/localDb.js';

/**
 * Parsea el string billeteBreakdownJson y calcula los totales por denominación.
 * @param {string} breakdownJson - JSON serializado de billetes [{ denominacion, fajos, sueltos }]
 * @returns {{ items: Array, totalCalculated: number, billCounts: Object }}
 */
export function parseCashExtractionBreakdown(breakdownJson) {
  if (!breakdownJson) {
    return { items: [], totalCalculated: 0, billCounts: {} };
  }

  try {
    const raw = typeof breakdownJson === 'string' ? JSON.parse(breakdownJson) : breakdownJson;
    let totalCalculated = 0;
    const billCounts = {};

    const items = raw.map((b) => {
      const fajos = parseInt(b.fajos) || 0;
      const sueltos = parseInt(b.sueltos) || 0;
      const denom = parseInt(b.denominacion) || 0;

      const totalBilletes = fajos * 100 + sueltos;
      const subtotal = totalBilletes * denom;
      totalCalculated += subtotal;

      if (denom > 0) {
        billCounts[denom] = {
          blocks: 0,
          batches: fajos,
          qtys: sueltos,
          subtotal
        };
      }

      return {
        ...b,
        denominacion: denom,
        fajos,
        sueltos,
        totalBilletes,
        subtotal
      };
    });

    return { items, totalCalculated, billCounts };
  } catch (err) {
    console.error("Error al parsear billeteBreakdownJson:", err);
    return { items: [], totalCalculated: 0, billCounts: {} };
  }
}

/**
 * Obtiene las extracciones desde Firestore y actualiza el caché de IndexedDB local.
 * Si ocurre un error de red o timeout, retorna las extracciones desde IndexedDB.
 * @param {Object} db - Instancia de Firestore.
 * @returns {Promise<Array<Object>>} Lista de extracciones.
 */
export async function fetchCashExtractions(db) {
  // Real Local-First: read directly from local IndexedDB (synced in background by SyncService)
  return getCashExtractionsFromLocal();
}

/**
 * Obtiene las extracciones guardadas en IndexedDB local.
 * @returns {Promise<Array<Object>>} Lista de extracciones locales.
 */
export async function getCashExtractionsFromLocal() {
  try {
    const extractions = await localDb.cash_extractions.toArray();
    return extractions.sort((a, b) => (b.timestamp || b.updatedAt || 0) - (a.timestamp || a.updatedAt || 0));
  } catch (e) {
    console.error("Error leyendo cash_extractions desde IndexedDB:", e);
    return [];
  }
}

/**
 * Actualiza el estado de una extracción en Firestore y en IndexedDB local.
 * @param {Object} db - Instancia de Firestore.
 * @param {string} extractionId - ID del documento de extracción.
 * @param {string} status - Nuevo estado ('PENDING', 'ACCEPTED', etc.).
 * @param {string|null} accountingEntryId - ID del movimiento contable vinculado.
 * @returns {Promise<void>}
 */
export async function updateExtractionStatus(db, extractionId, status, accountingEntryId = null) {
  const updatedAt = Date.now();
  const updatePayload = {
    status,
    updatedAt
  };

  if (accountingEntryId) {
    updatePayload.accountingEntryId = accountingEntryId;
  }

  // 1. Actualizar Firestore
  const docRef = doc(db, 'cash_extractions', extractionId);
  await updateDoc(docRef, updatePayload);

  // 2. Actualizar IndexedDB local
  try {
    const localItem = await localDb.cash_extractions.get(extractionId);
    if (localItem) {
      await localDb.cash_extractions.put({
        ...localItem,
        ...updatePayload
      });
    }
  } catch (e) {
    console.warn("Error actualizando IndexedDB local para extracción:", e);
  }
}
