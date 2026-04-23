// src/adapters/repositories/CheckRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class CheckRepository {
  constructor() {
    this.checksCache = null;
    this.contactsCache = null;
  }

  async fetchChecks(uid) {
    if (this.checksCache) return this.checksCache;
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
    if (this.contactsCache) return this.contactsCache;
    this.contactsCache = await api.fetchClients(db);
    return this.contactsCache;
  }
}
