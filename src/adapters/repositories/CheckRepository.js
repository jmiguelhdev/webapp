// src/adapters/repositories/CheckRepository.js
import { db } from '../../firebase.js';
import * as checksApi from '../../api/checksApi.js';
import * as clientsApi from '../../api/clientsApi.js';
import * as travelsApi from '../../api/travelsApi.js';

export class CheckRepository {
  constructor() {}

  async fetchChecks(uid) {
    return checksApi.fetchCheckOperations(db, uid);
  }

  async saveCheck(uid, operation) {
    return checksApi.saveCheckOperation(db, uid, operation);
  }

  async deleteCheck(operationId) {
    return checksApi.deleteCheckOperation(db, operationId);
  }

  async getContacts() {
    return clientsApi.fetchClients(db);
  }

  async getTravels(uid) {
    return travelsApi.fetchTravels(db, uid);
  }
}
