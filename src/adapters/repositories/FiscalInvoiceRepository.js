/**
 * @file FiscalInvoiceRepository.js
 * @description Repositorio para la gestión, filtrado y resumen métrico de Comprobantes Fiscales ARCA.
 * @module adapters/repositories/FiscalInvoiceRepository
 */
import { db } from '../../firebase.js';
import * as fiscalInvoiceApi from '../api/FiscalInvoiceApi.js';
import * as clientApi from '../api/ClientApi.js';

export class FiscalInvoiceRepository {
  constructor() {}

  /**
   * Obtiene la lista completa de comprobantes fiscales enriquecidos.
   * @returns {Promise<Array<Object>>}
   */
  async getInvoices() {
    const rawInvoices = await fiscalInvoiceApi.fetchFiscalInvoices(db);
    return rawInvoices;
  }

  /**
   * Obtiene la lista de todos los clientes para poblar los desplegables de filtros.
   * @returns {Promise<Array<Object>>}
   */
  async getClients() {
    try {
      return await clientApi.fetchClients(db);
    } catch (e) {
      console.warn('[FiscalInvoiceRepository] Error al obtener clientes:', e);
      return [];
    }
  }

  /**
   * Filtra comprobantes fiscales en memoria según criterios multicriterio.
   * @param {Array<Object>} invoices - Lista completa de comprobantes.
   * @param {Object} filters - Criterios de filtrado.
   * @returns {Array<Object>} Lista de comprobantes filtrados.
   */
  filterInvoices(invoices, { puntoVenta, dateFrom, dateTo, clientSearch, cbteTipo, textSearch }) {
    if (!Array.isArray(invoices)) return [];

    return invoices.filter(inv => {
      // 1. Filtro por Punto de Venta / Sucursal Emisora
      if (puntoVenta && puntoVenta !== 'ALL') {
        const ptoStr = String(inv.puntoVenta || inv.ptoVta || '');
        const storeStr = String(inv.storeId || '');
        if (ptoStr !== String(puntoVenta) && storeStr !== String(puntoVenta)) {
          return false;
        }
      }

      // 2. Filtro por Rango de Fechas (YYYYMMDD o YYYY-MM-DD o timestamp)
      const invDateStr = this._parseInvoiceDate(inv);
      if (dateFrom && invDateStr < dateFrom) return false;
      if (dateTo && invDateStr > dateTo) return false;

      // 3. Filtro por Cliente / Receptor
      if (clientSearch && clientSearch !== 'ALL') {
        const docReceptor = String(inv.nroDocReceptor || inv.cuitReceptor || '');
        const nombreReceptor = String(inv.nombreReceptor || inv.razonSocial || '').toLowerCase();
        const searchLower = String(clientSearch).toLowerCase();
        if (!docReceptor.includes(searchLower) && !nombreReceptor.includes(searchLower)) {
          return false;
        }
      }

      // 4. Filtro por Tipo de Comprobante (CbteTipo)
      if (cbteTipo && cbteTipo !== 'ALL') {
        const tipoCode = Number(inv.tipoComprobante || inv.cbteTipo || 0);
        if (cbteTipo === 'FACTURAS' && ![1, 6, 11, 51].includes(tipoCode)) return false;
        if (cbteTipo === 'NC' && ![3, 8, 13, 53].includes(tipoCode)) return false;
        if (cbteTipo === 'ND' && ![2, 7, 12, 52].includes(tipoCode)) return false;
        if (!['ALL', 'FACTURAS', 'NC', 'ND'].includes(cbteTipo) && tipoCode !== Number(cbteTipo)) {
          return false;
        }
      }

      // 5. Búsqueda por texto libre (Número, CAE, SaleID)
      if (textSearch && textSearch.trim() !== '') {
        const q = textSearch.trim().toLowerCase();
        const nroStr = String(inv.numeroComprobante || inv.nro || '');
        const caeStr = String(inv.cae || '');
        const saleIdStr = String(inv.saleId || '').toLowerCase();
        const clientStr = String(inv.nombreReceptor || '').toLowerCase();
        
        const matches = nroStr.includes(q) || caeStr.includes(q) || saleIdStr.includes(q) || clientStr.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }

  /**
   * Calcula métricas resúmenes (KPI Cards) sobre la lista filtrada.
   * @param {Array<Object>} invoices 
   * @returns {Object} Métricas calculadas.
   */
  calculateMetrics(invoices) {
    let totalFacturado = 0;
    let totalNeto = 0;
    let totalIva = 0;
    let totalNC = 0;
    let totalND = 0;
    let countInvoices = 0;

    invoices.forEach(inv => {
      const tipo = Number(inv.tipoComprobante || inv.cbteTipo || 0);
      const total = Number(inv.importeTotal || 0);
      const neto = Number(inv.importeNetoGravado || 0);
      const iva = Number(inv.importeIva || 0);

      countInvoices++;

      // NC (3, 8, 13, 53) reducen saldo / importe
      if ([3, 8, 13, 53].includes(tipo)) {
        totalNC += total;
        totalFacturado -= total;
        totalNeto -= neto;
        totalIva -= iva;
      } else if ([2, 7, 12, 52].includes(tipo)) { // ND (2, 7, 12, 52) incrementan saldo
        totalND += total;
        totalFacturado += total;
        totalNeto += neto;
        totalIva += iva;
      } else { // Facturas
        totalFacturado += total;
        totalNeto += neto;
        totalIva += iva;
      }
    });

    return {
      countInvoices,
      totalFacturado,
      totalNeto,
      totalIva,
      totalNC,
      totalND
    };
  }

  /**
   * Helper para normalizar la fecha del comprobante a formato ISO YYYY-MM-DD.
   * @private
   */
  _parseInvoiceDate(inv) {
    const rawFch = inv.fechaEmision || inv.cbteFch;
    if (typeof rawFch === 'string' && rawFch.length === 8 && !rawFch.includes('-')) {
      // Formato "YYYYMMDD" -> "YYYY-MM-DD"
      return `${rawFch.substring(0, 4)}-${rawFch.substring(4, 6)}-${rawFch.substring(6, 8)}`;
    }
    if (typeof rawFch === 'string' && rawFch.includes('-')) {
      return rawFch.substring(0, 10);
    }
    if (inv.updatedAt) {
      const d = new Date(inv.updatedAt);
      return d.toISOString().substring(0, 10);
    }
    return '';
  }
}
