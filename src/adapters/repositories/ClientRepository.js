// src/adapters/repositories/ClientRepository.js
import { db } from '../../firebase.js';
import * as clientsApi from '../../api/clientsApi.js';
import * as accountingApi from '../../api/accountingApi.js';
import * as checksApi from '../../api/checksApi.js';
import * as faenaApi from '../../api/faenaApi.js';

export class ClientRepository {
  constructor() {}

  async getClients() {
    return clientsApi.fetchClients(db);
  }

  async saveClient(clientData) {
    return clientsApi.saveClient(db, clientData);
  }

  async getCategoryPrices() {
    return clientsApi.fetchCategoryPrices(db);
  }

  async saveCategoryPrices(prices) {
    return clientsApi.saveCategoryPrices(db, prices);
  }

  async getCamaras() {
    return clientsApi.fetchCamaras(db);
  }

  async saveCamaras(camarasList) {
    return clientsApi.saveCamaras(db, camarasList);
  }

  async getTransactions(clientId) {
    return accountingApi.fetchTransactions(db, clientId);
  }

  async getAllTransactions() {
    return accountingApi.fetchAllTransactions(db);
  }

  async addTransaction(transaction) {
    return accountingApi.addTransaction(db, transaction);
  }

  async syncAccountingToTransaction(accountingId, data) {
    return accountingApi.syncAccountingToTransaction(db, accountingId, data);
  }

  async syncCheckTransaction(checkId, side, transactionData) {
    return checksApi.syncTransactionByCheck(db, 'transactions', checkId, side, transactionData);
  }

  async getDispatchedFaenas(clientName, startDate, endDate) {
    return faenaApi.fetchDispatchedFaenasInRange(db, clientName, startDate, endDate);
  }

  async getTransactionsInRange(clientId, startDate, endDate) {
    return accountingApi.fetchTransactionsInRange(db, clientId, startDate, endDate);
  }

  async savePriceAnalysis(analysisData) {
    return accountingApi.savePriceAnalysis(db, analysisData);
  }

  async getPriceAnalyses(clientId) {
    return accountingApi.fetchPriceAnalyses(db, clientId);
  }
}
