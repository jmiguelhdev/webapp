// src/adapters/repositories/ClientRepository.js
import { db } from '../../firebase.js';
import * as clientApi from '../api/ClientApi.js';
import * as faenaApi from '../api/FaenaApi.js';
import * as travelApi from '../api/TravelApi.js';
import * as accountingApi from '../api/AccountingApi.js';

/**
 * Repositorio para la gestión de clientes, cuentas corrientes y análisis financiero de precios de venta.
 */
export class ClientRepository {
  constructor() {}

  /**
   * Obtiene todos los clientes registrados.
   * @returns {Promise<Array<Object>>} Lista de clientes.
   */
  async getClients() {
    return clientApi.fetchClients(db);
  }

  /**
   * Crea o actualiza la ficha de un cliente (nombre, CUIT, límites financieros).
   * @param {Object} clientData - Datos del cliente.
   * @returns {Promise<void>}
   */
  async saveClient(clientData) {
    return clientApi.saveClient(db, clientData);
  }

  /**
   * Obtiene la lista de precios de referencia sugerida por categoría.
   * @returns {Promise<Object>} Mapeo de categoría a precio.
   */
  async getCategoryPrices() {
    return clientApi.fetchCategoryPrices(db);
  }

  /**
   * Guarda la configuración de precios de venta sugeridos por categoría.
   * @param {Object} prices - Mapeo de categoría a precio.
   * @returns {Promise<void>}
   */
  async saveCategoryPrices(prices) {
    return clientApi.saveCategoryPrices(db, prices);
  }

  /**
   * Obtiene las cámaras frigoríficas.
   * @returns {Promise<Array<Object>>} Lista de cámaras.
   */
  async getCamaras() {
    return faenaApi.fetchCamaras(db);
  }

  /**
   * Guarda los datos de configuración de las cámaras frigoríficas.
   * @param {Array<Object>} camarasList - Lista de cámaras.
   * @returns {Promise<void>}
   */
  async saveCamaras(camarasList) {
    return faenaApi.saveCamaras(db, camarasList);
  }

  /**
   * Obtiene la cuenta corriente (transacciones) de un cliente específico.
   * @param {string} clientId - ID del cliente.
   * @returns {Promise<Array<Object>>} Lista de transacciones.
   */
  async getTransactions(clientId) {
    return clientApi.fetchTransactions(db, clientId);
  }

  /**
   * Obtiene todas las transacciones de clientes registradas en la base de datos.
   * @returns {Promise<Array<Object>>} Lista de transacciones globales.
   */
  async getAllTransactions() {
    return clientApi.fetchAllTransactions(db);
  }

  /**
   * Registra una transacción (venta o cobro) en la cuenta de un cliente.
   * @param {Object} transaction - Datos de la transacción.
   * @returns {Promise<void>}
   */
  async addTransaction(transaction) {
    return clientApi.addTransaction(db, transaction);
  }

  /**
   * Vincula y sincroniza un cobro asentado en Caja hacia la cuenta corriente del cliente.
   * @param {string} accountingId - ID del asiento contable de Caja.
   * @param {Object} data - Parámetros de la transacción a sincronizar.
   * @returns {Promise<void>}
   */
  async syncAccountingToTransaction(accountingId, data) {
    return accountingApi.syncAccountingToTransaction(db, accountingId, data);
  }

  /**
   * Sincroniza movimientos de cobro o entrega de cheques.
   * @param {string} checkId - ID del cheque.
   * @param {string} side - Lado de la transacción ('BUY' o 'SELL').
   * @param {Object|null} transactionData - Datos a sincronizar o null para desvincular.
   * @returns {Promise<void>}
   */
  async syncCheckTransaction(checkId, side, transactionData) {
    return clientApi.syncTransactionByCheck(db, 'transactions', checkId, side, transactionData);
  }

  /**
   * Obtiene garrones despachados a un cliente en un rango de fechas.
   * @param {string} clientName - Nombre del cliente.
   * @param {string} startDate - Fecha inicial YYYY-MM-DD.
   * @param {string} endDate - Fecha final YYYY-MM-DD.
   * @returns {Promise<Array<Object>>} Lista de garrones.
   */
  async getDispatchedFaenas(clientName, startDate, endDate) {
    return faenaApi.fetchDispatchedFaenasInRange(db, clientName, startDate, endDate);
  }

  /**
   * Obtiene las transacciones financieras de un cliente en un rango de fechas.
   * @param {string} clientId - ID del cliente.
   * @param {string} startDate - Fecha inicial YYYY-MM-DD.
   * @param {string} endDate - Fecha final YYYY-MM-DD.
   * @returns {Promise<Array<Object>>} Lista de transacciones.
   */
  async getTransactionsInRange(clientId, startDate, endDate) {
    return clientApi.fetchTransactionsInRange(db, clientId, startDate, endDate);
  }

  /**
   * Guarda un reporte de análisis de precio final consolidado en base de datos.
   * @param {Object} analysisData - Resultados calculados del análisis.
   * @returns {Promise<void>}
   */
  async savePriceAnalysis(analysisData) {
    return clientApi.savePriceAnalysis(db, analysisData);
  }

  /**
   * Carga el historial de simulaciones y análisis de precios corridos de un cliente.
   * @param {string} clientId - ID del cliente.
   * @returns {Promise<Array<Object>>} Historial de reportes.
   */
  async getPriceAnalyses(clientId) {
    return clientApi.fetchPriceAnalyses(db, clientId);
  }

  /**
   * Obtiene el detalle de un despacho o venta por ID.
   * @param {string|number} saleId - ID del despacho/venta.
   * @returns {Promise<Object>} Detalle de la venta.
   */
  async getSaleById(saleId) {
    return clientApi.fetchSaleById(db, saleId);
  }

  /**
   * Obtiene productos comerciales habilitados.
   * @returns {Promise<Array<Object>>} Lista de productos.
   */
  async getProducts() {
    return travelApi.fetchProducts(db);
  }

  /**
   * Obtiene productos de tipo materia prima habilitados.
   * @returns {Promise<Array<Object>>} Lista de materias primas.
   */
  async getRawMaterialProducts() {
    return travelApi.fetchRawMaterialProducts(db);
  }

  /**
   * Obtiene la lista de proveedores de hacienda o servicios.
   * @returns {Promise<Array<Object>>} Lista de proveedores.
   */
  async getProviders() {
    return travelApi.fetchProviders(db);
  }

  /**
   * Registra directamente la ficha de un proveedor.
   * @param {Object} providerData - Datos del proveedor.
   * @returns {Promise<void>}
   */
  async saveProviderDirectly(providerData) {
    return travelApi.saveProviderDirectly(db, providerData);
  }

  /**
   * Obtiene las listas de precios configuradas.
   * @returns {Promise<Array<Object>>} Colección de listas de precios.
   */
  async getPriceLists() {
    return travelApi.fetchPriceLists(db);
  }
}
