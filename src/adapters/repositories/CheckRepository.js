// src/adapters/repositories/CheckRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class CheckRepository {
  constructor() {
    this.checksCache = null;
    this.contactsCache = null;
  }

  async fetchChecks(uid) {
    const cacheKey = `checks_${uid}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      this.checksCache = JSON.parse(cached);
      return this.checksCache;
    }
    this.checksCache = await api.fetchCheckOperations(db, uid);
    localStorage.setItem(cacheKey, JSON.stringify(this.checksCache));
    return this.checksCache;
  }

  async saveCheck(uid, operation) {
    const res = await api.saveCheckOperation(db, uid, operation);
    localStorage.removeItem(`checks_${uid}`);
    this.checksCache = null;
    return res;
  }

  async deleteCheck(operationId) {
    // try to clear cache
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('checks_')) {
            localStorage.removeItem(key);
        }
    }
    const res = await api.deleteCheckOperation(db, operationId);
    this.checksCache = null;
    return res;
  }

  async getContacts() {
    const cacheKey = 'checks_contacts';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      this.contactsCache = JSON.parse(cached);
      return this.contactsCache;
    }
    this.contactsCache = await api.fetchClients(db);
    localStorage.setItem(cacheKey, JSON.stringify(this.contactsCache));
    return this.contactsCache;
  }
}
