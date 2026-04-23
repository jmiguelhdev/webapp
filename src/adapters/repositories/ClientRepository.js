// src/adapters/repositories/ClientRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class ClientRepository {
  constructor() {
    this.clientsCache = null;
    this.categoryPricesCache = null;
    this.camarasCache = null;
    this.transactionsCache = new Map(); // clientId -> transactions array
    this.priceAnalysesCache = new Map(); // clientId -> analyses array
  }

  async getClients() {
    if (this.clientsCache) return this.clientsCache;
    this.clientsCache = await api.fetchClients(db);
    return this.clientsCache;
  }

  async saveClient(clientData) {
    const res = await api.saveClient(db, clientData);
    this.clientsCache = null;
    return res;
  }

  async getCategoryPrices() {
    if (this.categoryPricesCache) return this.categoryPricesCache;
    this.categoryPricesCache = await api.fetchCategoryPrices(db);
    return this.categoryPricesCache;
  }

  async saveCategoryPrices(prices) {
    const res = await api.saveCategoryPrices(db, prices);
    this.categoryPricesCache = null;
    return res;
  }

  async getCamaras() {
    if (this.camarasCache) return this.camarasCache;
    this.camarasCache = await api.fetchCamaras(db);
    return this.camarasCache;
  }

  async saveCamaras(camarasList) {
    const res = await api.saveCamaras(db, camarasList);
    this.camarasCache = null;
    return res;
  }

  async getTransactions(clientId) {
    if (this.transactionsCache.has(clientId)) return this.transactionsCache.get(clientId);
    const txs = await api.fetchTransactions(db, clientId);
    this.transactionsCache.set(clientId, txs);
    return txs;
  }

  async addTransaction(transaction) {
    const res = await api.addTransaction(db, transaction);
    if (transaction.clientId) {
      this.transactionsCache.delete(transaction.clientId);
    }
    return res;
  }

  async syncAccountingToTransaction(accountingId, data) {
    const res = await api.syncAccountingToTransaction(db, accountingId, data);
    // Transacciones globales cambiaron, limpiamos el caché de transacciones
    this.transactionsCache.clear();
    return res;
  }

  async getDispatchedFaenas(clientName, startDate, endDate) {
    return api.fetchDispatchedFaenasInRange(db, clientName, startDate, endDate);
  }

  async getTransactionsInRange(clientId, startDate, endDate) {
    return api.fetchTransactionsInRange(db, clientId, startDate, endDate);
  }

  async savePriceAnalysis(analysisData) {
    const res = await api.savePriceAnalysis(db, analysisData);
    if (analysisData.clientId) {
      this.priceAnalysesCache.delete(analysisData.clientId);
    }
    return res;
  }

  async getPriceAnalyses(clientId) {
    if (this.priceAnalysesCache.has(clientId)) return this.priceAnalysesCache.get(clientId);
    const analyses = await api.fetchPriceAnalyses(db, clientId);
    this.priceAnalysesCache.set(clientId, analyses);
    return analyses;
  }
}
