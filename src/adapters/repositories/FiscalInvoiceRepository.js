/**
 * @file FiscalInvoiceRepository.js
 * @description Repositorio para la gestión, filtrado y resumen métrico de Comprobantes Fiscales (Con CAE) y Ventas No Fiscales (Sin CAE).
 * @module adapters/repositories/FiscalInvoiceRepository
 */
import { db } from '../../firebase.js';
import * as fiscalInvoiceApi from '../api/FiscalInvoiceApi.js';
import * as clientApi from '../api/ClientApi.js';

export class FiscalInvoiceRepository {
  constructor() {}

  /**
   * Obtiene la lista completa de comprobantes.
   * @returns {Promise<Array<Object>>}
   */
  async getInvoices() {
    const rawInvoices = await fiscalInvoiceApi.fetchFiscalInvoices(db);
    return rawInvoices;
  }

  /**
   * Obtiene la lista de clientes para los filtros.
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
   * REGLA ESTRICTA DE CONDICIÓN FISCAL:
   * Solo cuando contenga CAE (Código de Autorización Electrónico) se considera FISCAL.
   * Cualquier otro caso es NO FISCAL.
   * @param {Object} inv 
   * @returns {boolean}
   */
  isInvoiceFiscal(inv) {
    return Boolean(inv && inv.cae && String(inv.cae).trim() !== '' && String(inv.cae).trim() !== 'null');
  }

  /**
   * Genera la cadena formateada del número de comprobante.
   * - Fiscal (con CAE): 00001-00000176
   * - No Fiscal (sin CAE): 00001-1786395116960
   * @param {Object} inv 
   * @returns {string}
   */
  formatFullVoucherNumber(inv) {
    const ptoVtaPadded = String(inv.puntoVenta || inv.ptoVta || 1).padStart(5, '0');
    const nroRaw = String(inv.numeroComprobante || inv.nro || 0);

    if (this.isInvoiceFiscal(inv)) {
      return `${ptoVtaPadded}-${nroRaw.padStart(8, '0')}`;
    }
    return `${ptoVtaPadded}-${nroRaw}`;
  }

  /**
   * Filtra comprobantes en memoria según criterios multicriterio.
   * @param {Array<Object>} invoices - Lista completa de comprobantes.
   * @param {Object} filters - Criterios de filtrado.
   * @returns {Array<Object>} Lista de comprobantes filtrados.
   */
  filterInvoices(invoices, { puntoVenta, dateFrom, dateTo, clientSearch, cbteTipo, fiscalCondition, ivaCondition, textSearch }) {
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

      // 2. Filtro por Rango de Fechas
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

      // 4. Filtro por Tipo de Comprobante
      if (cbteTipo && cbteTipo !== 'ALL') {
        const tipoCode = Number(inv.tipoComprobante || inv.cbteTipo || 0);
        if (cbteTipo === 'FACTURAS' && ![1, 6, 11, 51].includes(tipoCode)) return false;
        if (cbteTipo === 'NC' && ![3, 8, 13, 53].includes(tipoCode)) return false;
        if (cbteTipo === 'ND' && ![2, 7, 12, 52].includes(tipoCode)) return false;
        if (!['ALL', 'FACTURAS', 'NC', 'ND'].includes(cbteTipo) && tipoCode !== Number(cbteTipo)) {
          return false;
        }
      }

      // 5. Filtro por Condición Fiscal (Solo con CAE = FISCAL)
      if (fiscalCondition && fiscalCondition !== 'ALL') {
        const isFiscal = this.isInvoiceFiscal(inv);
        if (fiscalCondition === 'FISCAL' && !isFiscal) return false;
        if (fiscalCondition === 'NO_FISCAL' && isFiscal) return false;
      }

      // 6. NUEVO: Filtro por Condición frente al IVA del Receptor
      if (ivaCondition && ivaCondition !== 'ALL') {
        const tipoCode = Number(inv.tipoComprobante || inv.cbteTipo || 0);
        const isRI = [1, 2, 3].includes(tipoCode) || (inv.tipoDocReceptor === 80 && inv.nroDocReceptor > 0);
        const isCF = [6, 7, 8].includes(tipoCode) || inv.tipoDocReceptor === 99 || (!inv.nroDocReceptor || inv.nroDocReceptor === 0);
        const isExMo = [11, 12, 13].includes(tipoCode);

        if (ivaCondition === 'RI' && !isRI) return false;
        if (ivaCondition === 'CF' && !isCF) return false;
        if (ivaCondition === 'EX_MO' && !isExMo) return false;
      }

      // 7. Búsqueda por texto libre
      if (textSearch && textSearch.trim() !== '') {
        const q = textSearch.trim().toLowerCase();
        const fullNroStr = this.formatFullVoucherNumber(inv).toLowerCase();
        const nroStr = String(inv.numeroComprobante || inv.nro || '').toLowerCase();
        const caeStr = String(inv.cae || '').toLowerCase();
        const saleIdStr = String(inv.saleId || '').toLowerCase();
        const clientStr = String(inv.nombreReceptor || '').toLowerCase();

        const matches = fullNroStr.includes(q) || nroStr.includes(q) || caeStr.includes(q) || saleIdStr.includes(q) || clientStr.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }

  /**
   * Calcula métricas resúmenes (KPI Cards) sobre la lista filtrada.
   * Discriminando Total Facturado (Con CAE) y Ventas No Fiscales (Sin CAE).
   * @param {Array<Object>} invoices 
   * @returns {Object} Métricas calculadas.
   */
  calculateMetrics(invoices) {
    let totalFacturadoFiscal = 0;
    let totalNetoFiscal = 0;
    let totalIvaFiscal = 0;

    let totalVentasNoFiscales = 0;

    let totalNC = 0;
    let totalND = 0;
    let countInvoices = 0;
    let countFiscales = 0;
    let countNoFiscales = 0;

    invoices.forEach(inv => {
      const tipo = Number(inv.tipoComprobante || inv.cbteTipo || 0);
      const total = Number(inv.importeTotal || 0);
      const neto = Number(inv.importeNetoGravado || 0);
      const iva = Number(inv.importeIva || 0);
      const isFiscal = this.isInvoiceFiscal(inv);

      countInvoices++;

      if (isFiscal) {
        countFiscales++;
        if ([3, 8, 13, 53].includes(tipo)) {
          totalNC += total;
          totalFacturadoFiscal -= total;
          totalNetoFiscal -= neto;
          totalIvaFiscal -= iva;
        } else if ([2, 7, 12, 52].includes(tipo)) {
          totalND += total;
          totalFacturadoFiscal += total;
          totalNetoFiscal += neto;
          totalIvaFiscal += iva;
        } else {
          totalFacturadoFiscal += total;
          totalNetoFiscal += neto;
          totalIvaFiscal += iva;
        }
      } else {
        countNoFiscales++;
        if ([3, 8, 13, 53].includes(tipo)) {
          totalNC += total;
          totalVentasNoFiscales -= total;
        } else if ([2, 7, 12, 52].includes(tipo)) {
          totalND += total;
          totalVentasNoFiscales += total;
        } else {
          totalVentasNoFiscales += total;
        }
      }
    });

    return {
      countInvoices,
      countFiscales,
      countNoFiscales,
      totalFacturadoFiscal,
      totalNetoFiscal,
      totalIvaFiscal,
      totalVentasNoFiscales,
      totalNC,
      totalND
    };
  }

  _parseInvoiceDate(inv) {
    const rawFch = inv.fechaEmision || inv.cbteFch;
    if (typeof rawFch === 'string' && rawFch.length === 8 && !rawFch.includes('-')) {
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
