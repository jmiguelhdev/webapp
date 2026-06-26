// src/adapters/repositories/ClientRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class ClientRepository {
  constructor() {}

  async getClients() {
    return api.fetchClients(db);
  }

  async saveClient(clientData) {
    return api.saveClient(db, clientData);
  }

  async getCategoryPrices() {
    return api.fetchCategoryPrices(db);
  }

  async saveCategoryPrices(prices) {
    return api.saveCategoryPrices(db, prices);
  }

  async getCamaras() {
    return api.fetchCamaras(db);
  }

  async saveCamaras(camarasList) {
    return api.saveCamaras(db, camarasList);
  }

  async getTransactions(clientId) {
    return api.fetchTransactions(db, clientId);
  }

  async getAllTransactions() {
    return api.fetchAllTransactions(db);
  }

  async addTransaction(transaction) {
    return api.addTransaction(db, transaction);
  }

  async syncAccountingToTransaction(accountingId, data) {
    return api.syncAccountingToTransaction(db, accountingId, data);
  }

  async syncCheckTransaction(checkId, side, transactionData) {
    return api.syncTransactionByCheck(db, 'transactions', checkId, side, transactionData);
  }

  async getDispatchedFaenas(clientName, startDate, endDate) {
    return api.fetchDispatchedFaenasInRange(db, clientName, startDate, endDate);
  }

  async getTransactionsInRange(clientId, startDate, endDate) {
    return api.fetchTransactionsInRange(db, clientId, startDate, endDate);
  }

  async savePriceAnalysis(analysisData) {
    return api.savePriceAnalysis(db, analysisData);
  }

  async getPriceAnalyses(clientId) {
    return api.fetchPriceAnalyses(db, clientId);
  }

  async getSaleById(saleId) {
    return api.fetchSaleById(db, saleId);
  }

  async getProducts() {
    return api.fetchProducts(db);
  }
}
