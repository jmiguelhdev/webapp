// src/adapters/repositories/CheckRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class CheckRepository {
  constructor() {
    this.checksCache = null;
    this.contactsCache = null;
  }

  async fetchChecks(uid) {
    // Use only in-memory cache (per session). localStorage cache had no TTL
    // and caused stale data when checks were added from another device/deployment.
    if (this.checksCache) {
      return this.checksCache;
    }
    // Clear any stale localStorage entries from previous versions
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('checks_')) localStorage.removeItem(key);
    }
    this.checksCache = await api.fetchCheckOperations(db, uid);
    return this.checksCache;
  }

  async saveCheck(uid, operation) {
    const res = await api.saveCheckOperation(db, uid, operation);
    this.checksCache = null;
    return res;
  }

  async deleteCheck(operationId) {
    const res = await api.deleteCheckOperation(db, operationId);
    this.checksCache = null;
    return res;
  }

  async getContacts() {
    // Use the same cache key as ClientRepository so that adding/editing
    // a client in Settings automatically invalidates this list too.
    const cacheKey = 'client_clients';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      this.contactsCache = JSON.parse(cached);
      return this.contactsCache;
    }
    this.contactsCache = await api.fetchClients(db);
    localStorage.setItem(cacheKey, JSON.stringify(this.contactsCache));
    return this.contactsCache;
  }

  async getTravels(uid) {
    return await api.fetchTravels(db, uid);
  }
}
