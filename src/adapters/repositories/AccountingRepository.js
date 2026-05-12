// src/adapters/repositories/AccountingRepository.js
import { db } from '../../firebase.js';
import * as accountingApi from '../../api/accountingApi.js';
import * as clientsApi from '../../api/clientsApi.js';
import * as travelsApi from '../../api/travelsApi.js';

export class AccountingRepository {
  constructor(collectionName = 'accounting_entries') {
    this.collectionName = collectionName;
  }

  async fetchEntries(uid) {
    return accountingApi.fetchAccountingEntries(db, uid, this.collectionName);
  }

  async saveEntry(uid, entry) {
    return accountingApi.saveAccountingEntry(db, uid, entry, this.collectionName);
  }

  async deleteEntry(entryId) {
    return accountingApi.deleteAccountingEntry(db, entryId, this.collectionName);
  }

  async getClients() {
    return clientsApi.fetchClients(db);
  }

  async getTravels(uid) {
    return travelsApi.fetchTravels(db, uid);
  }
}
