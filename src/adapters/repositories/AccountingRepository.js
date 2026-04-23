// src/adapters/repositories/AccountingRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class AccountingRepository {
  constructor(collectionName = 'accounting_entries') {
    this.collectionName = collectionName;
    this.entriesCache = null;
    this.clientsCache = null;
    this.travelsCache = null;
  }

  async fetchEntries(uid) {
    if (this.entriesCache) return this.entriesCache;
    this.entriesCache = await api.fetchAccountingEntries(db, uid, this.collectionName);
    return this.entriesCache;
  }

  async saveEntry(uid, entry) {
    const res = await api.saveAccountingEntry(db, uid, entry, this.collectionName);
    this.entriesCache = null;
    return res;
  }

  async deleteEntry(entryId) {
    const res = await api.deleteAccountingEntry(db, entryId, this.collectionName);
    this.entriesCache = null;
    return res;
  }

  async getClients() {
    if (this.clientsCache) return this.clientsCache;
    this.clientsCache = await api.fetchClients(db);
    return this.clientsCache;
  }

  async getTravels(uid) {
    if (this.travelsCache) return this.travelsCache;
    this.travelsCache = await api.fetchTravels(db, uid);
    return this.travelsCache;
  }
}
