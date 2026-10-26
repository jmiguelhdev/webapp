/**
 * @file DailyCashClosingRepository.js
 * @description Repositorio para la consulta y caché en memoria de cierres de caja diarios ('daily_cash_closings')
 * y sus subcolecciones cargadas bajo demanda (lazy-loading) para minimizar lecturas en Cloud Firestore.
 * @module adapters/repositories/DailyCashClosingRepository
 */
import { db } from '../../firebase.js';
import * as closingApi from '../api/DailyCashClosingApi.js';
import * as establishmentApi from '../api/EstablishmentApi.js';

export class DailyCashClosingRepository {
  constructor() {
    /** @type {Map<string, Array<Object>>} Caché de subcolecciones por llave `${closingId}__${subName}` */
    this.subcollectionCache = new Map();
    /** @type {Map<string, Array<Object>>} Caché de comprobantes por punto de venta `${startMs}_${endMs}_${branch}` */
    this.fiscalPosCache = new Map();
  }

  /**
   * Limpia la caché en memoria cuando el usuario presiona "Actualizar".
   */
  clearCache() {
    this.subcollectionCache.clear();
    this.fiscalPosCache.clear();
  }

  /**
   * Obtiene los documentos raíz de cierres de caja en un rango de fechas.
   * @param {number} startMs
   * @param {number} endMs
   * @param {string} [butcheryName='ALL']
   * @returns {Promise<Array<Object>>}
   */
  async getClosings(startMs, endMs, butcheryName = 'ALL') {
    return closingApi.fetchClosingsByDateRange(db, startMs, endMs, butcheryName);
  }

  /**
   * Obtiene la lista de establecimientos/sucursales configuradas para poblar el selector.
   * @returns {Promise<Array<string>>}
   */
  async getEstablishmentsNames() {
    try {
      const list = await establishmentApi.fetchEstablishments(db);
      return list.map(e => e.name || e.butcheryName || '').filter(Boolean);
    } catch (_) {
      return [];
    }
  }

  /**
   * Carga bajo demanda una subcolección para un conjunto de sesiones (ej. todas las PCs del día o una PC puntual).
   * Utiliza caché en memoria para no volver a cobrar lecturas de Firestore si ya se consultó.
   *
   * @param {Array<Object>} sessions - Sesiones raíz involucradas.
   * @param {string} subcollectionName - 'sales_by_cut' | 'extractions' | 'account_sales' | 'collections' | 'raw_materials'
   * @returns {Promise<Array<Object>>}
   */
  async getSubcollectionOnDemand(sessions, subcollectionName) {
    if (!Array.isArray(sessions) || sessions.length === 0) return [];

    const uncachedSessions = [];
    const combinedResults = [];

    for (const s of sessions) {
      const cId = s.closingId || s.id;
      const cacheKey = `${cId}__${subcollectionName}`;
      if (this.subcollectionCache.has(cacheKey)) {
        combinedResults.push(...this.subcollectionCache.get(cacheKey));
      } else {
        uncachedSessions.push(s);
      }
    }

    if (uncachedSessions.length > 0) {
      const fetched = await closingApi.fetchSubcollectionForMultipleSessions(db, uncachedSessions, subcollectionName);
      // Agrupar por closingId para guardar en caché individualmente
      const byClosing = new Map();
      uncachedSessions.forEach(s => byClosing.set(s.closingId || s.id, []));
      fetched.forEach(item => {
        const list = byClosing.get(item._closingId);
        if (list) list.push(item);
      });

      byClosing.forEach((items, cId) => {
        this.subcollectionCache.set(`${cId}__${subcollectionName}`, items);
        combinedResults.push(...items);
      });
    }

    return combinedResults;
  }

  /**
   * Carga bajo demanda el desglose de comprobantes fiscales agrupados por Punto de Venta (ARCA)
   * únicamente cuando el usuario lo solicita.
   *
   * @param {number} startMs
   * @param {number} endMs
   * @param {string} [butcheryName='ALL']
   * @returns {Promise<Array<Object>>}
   */
  async getFiscalVouchersByPosOnDemand(startMs, endMs, butcheryName = 'ALL') {
    const key = `${startMs}_${endMs}_${butcheryName}`;
    if (this.fiscalPosCache.has(key)) {
      return this.fiscalPosCache.get(key);
    }

    const vouchers = await closingApi.fetchFiscalVouchersByDateOnDemand(db, startMs, endMs, butcheryName);
    this.fiscalPosCache.set(key, vouchers);
    return vouchers;
  }
}
