// src/adapters/repositories/CheckRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class CheckRepository {
  async fetchChecks(uid) {
    return api.fetchCheckOperations(db, uid);
  }

  async saveCheck(uid, operation) {
    return api.saveCheckOperation(db, uid, operation);
  }

  async deleteCheck(operationId) {
    return api.deleteCheckOperation(db, operationId);
  }

  async getContacts() {
    return api.fetchClients(db);
  }
}
