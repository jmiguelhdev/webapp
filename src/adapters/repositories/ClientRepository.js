// src/adapters/repositories/ClientRepository.js
import { db } from '../../firebase.js';
import * as clientApi from '../../api/ClientApi.js';
import * as faenaApi from '../../api/FaenaApi.js';
import * as travelApi from '../../api/TravelApi.js';
import * as accountingApi from '../../api/AccountingApi.js';

export class ClientRepository {
  constructor() {}

  async getClients() {
    return clientApi.fetchClients(db);
  }

  async saveClient(clientData) {
    return clientApi.saveClient(db, clientData);
  }

  async getCategoryPrices() {
    return clientApi.fetchCategoryPrices(db);
  }

  async saveCategoryPrices(prices) {
    return clientApi.saveCategoryPrices(db, prices);
  }

  async getCamaras() {
    return faenaApi.fetchCamaras(db);
  }

  async saveCamaras(camarasList) {
    return faenaApi.saveCamaras(db, camarasList);
  }

  async getTransactions(clientId) {
    return clientApi.fetchTransactions(db, clientId);
  }

  async getAllTransactions() {
    return clientApi.fetchAllTransactions(db);
  }

  async addTransaction(transaction) {
    return clientApi.addTransaction(db, transaction);
  }

  async syncAccountingToTransaction(accountingId, data) {
    return accountingApi.syncAccountingToTransaction(db, accountingId, data);
  }

  async syncCheckTransaction(checkId, side, transactionData) {
    return clientApi.syncTransactionByCheck(db, 'transactions', checkId, side, transactionData);
  }

  async getDispatchedFaenas(clientName, startDate, endDate) {
    return faenaApi.fetchDispatchedFaenasInRange(db, clientName, startDate, endDate);
  }

  async getTransactionsInRange(clientId, startDate, endDate) {
    return clientApi.fetchTransactionsInRange(db, clientId, startDate, endDate);
  }

  async savePriceAnalysis(analysisData) {
    return clientApi.savePriceAnalysis(db, analysisData);
  }

  async getPriceAnalyses(clientId) {
    return clientApi.fetchPriceAnalyses(db, clientId);
  }

  async getSaleById(saleId) {
    return clientApi.fetchSaleById(db, saleId);
  }

  async getProducts() {
    return travelApi.fetchProducts(db);
  }

  async getRawMaterialProducts() {
    return travelApi.fetchRawMaterialProducts(db);
  }

  async getProviders() {
    return travelApi.fetchProviders(db);
  }

  async saveProviderDirectly(providerData) {
    return travelApi.saveProviderDirectly(db, providerData);
  }

  async getPriceLists() {
    return travelApi.fetchPriceLists(db);
  }
}
