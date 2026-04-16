// src/adapters/repositories/AccountingRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class AccountingRepository {
  constructor(collectionName = 'accounting_entries') {
    this.collectionName = collectionName;
  }

  async fetchEntries(uid) {
    return api.fetchAccountingEntries(db, uid, this.collectionName);
  }

  async saveEntry(uid, entry) {
    return api.saveAccountingEntry(db, uid, entry, this.collectionName);
  }

  async deleteEntry(entryId) {
    return api.deleteAccountingEntry(db, entryId, this.collectionName);
  }

  async getClients() {
    return api.fetchClients(db);
  }

  async getTravels(uid) {
    return api.fetchTravels(db, uid);
  }
}
