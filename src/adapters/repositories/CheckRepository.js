// src/adapters/repositories/CheckRepository.js
import { db } from '../../firebase.js';
import * as checkApi from '../../api/CheckApi.js';
import * as clientApi from '../../api/ClientApi.js';
import * as travelApi from '../../api/TravelApi.js';

export class CheckRepository {
  constructor() {}

  async fetchChecks(uid) {
    return checkApi.fetchCheckOperations(db, uid);
  }

  async saveCheck(uid, operation) {
    return checkApi.saveCheckOperation(db, uid, operation);
  }

  async deleteCheck(operationId) {
    return checkApi.deleteCheckOperation(db, operationId);
  }

  async getContacts() {
    return clientApi.fetchClients(db);
  }

  async getTravels(uid) {
    return travelApi.fetchTravels(db, uid);
  }

  subscribeChecks(uid, callback, onError) {
    return checkApi.subscribeToCheckOperations(db, uid, callback, onError);
  }
}
