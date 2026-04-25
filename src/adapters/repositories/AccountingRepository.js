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
    const cacheKey = `${this.collectionName}_${uid}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      this.entriesCache = JSON.parse(cached);
      return this.entriesCache;
    }
    this.entriesCache = await api.fetchAccountingEntries(db, uid, this.collectionName);
    localStorage.setItem(cacheKey, JSON.stringify(this.entriesCache));
    return this.entriesCache;
  }

  async saveEntry(uid, entry) {
    const res = await api.saveAccountingEntry(db, uid, entry, this.collectionName);
    localStorage.removeItem(`${this.collectionName}_${uid}`);
    this.entriesCache = null;
    return res;
  }

  async deleteEntry(entryId) {
    // we don't have uid here easily, but usually user only works with their own
    // to be safe, we might just clear entriesCache or try to clear from local storage if we can guess the uid
    // The safest is to rely on memory cache clear, but let's clear all local storage keys matching this collection
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${this.collectionName}_`)) {
            localStorage.removeItem(key);
        }
    }
    const res = await api.deleteAccountingEntry(db, entryId, this.collectionName);
    this.entriesCache = null;
    return res;
  }

  async getClients() {
    const cacheKey = 'accounting_clients';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      this.clientsCache = JSON.parse(cached);
      return this.clientsCache;
    }
    this.clientsCache = await api.fetchClients(db);
    localStorage.setItem(cacheKey, JSON.stringify(this.clientsCache));
    return this.clientsCache;
  }

  async getTravels(uid) {
    const cacheKey = `travels_${uid}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      this.travelsCache = JSON.parse(cached);
      return this.travelsCache;
    }
    this.travelsCache = await api.fetchTravels(db, uid);
    localStorage.setItem(cacheKey, JSON.stringify(this.travelsCache));
    return this.travelsCache;
  }
}
