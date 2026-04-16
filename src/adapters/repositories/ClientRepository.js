// src/adapters/repositories/ClientRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class ClientRepository {
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

  async addTransaction(transaction) {
    return api.addTransaction(db, transaction);
  }

  async syncAccountingToTransaction(accountingId, data) {
    return api.syncAccountingToTransaction(db, accountingId, data);
  }
}
