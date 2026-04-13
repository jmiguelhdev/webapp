// src/adapters/repositories/AccountingRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class AccountingRepository {
  async fetchEntries(uid) {
    return api.fetchAccountingEntries(db, uid);
  }

  async saveEntry(uid, entry) {
    return api.saveAccountingEntry(db, uid, entry);
  }

  async deleteEntry(entryId) {
    return api.deleteAccountingEntry(db, entryId);
  }

  async getClients() {
    return api.fetchClients(db);
  }

  async getTravels(uid) {
    return api.fetchTravels(db, uid);
  }
}
