// src/adapters/repositories/AccountingRepository.js
import { db } from '../../firebase.js';
import * as accountingApi from '../../api/AccountingApi.js';
import * as clientApi from '../../api/ClientApi.js';
import * as travelApi from '../../api/TravelApi.js';
import * as establishmentApi from '../../api/EstablishmentApi.js';

export class AccountingRepository {
  constructor(collectionName = 'accounting_entries') {
    this.collectionName = collectionName;
  }

  async fetchEntries(uid) {
    return accountingApi.fetchAccountingEntries(db, uid, this.collectionName);
  }

  async saveEntry(uid, entry) {
    return accountingApi.saveAccountingEntry(db, uid, entry, this.collectionName);
  }

  async deleteEntry(entryId) {
    return accountingApi.deleteAccountingEntry(db, entryId, this.collectionName);
  }

  async getClients() {
    return clientApi.fetchClients(db);
  }

  async getTravels(uid) {
    return travelApi.fetchTravels(db, uid);
  }

  async getEstablishments() {
    return establishmentApi.fetchEstablishments(db);
  }

  async getEmployees(establishmentId) {
    return establishmentApi.fetchEmployees(db, establishmentId);
  }

  async removeLinkedTransaction(entryId) {
    return accountingApi.removeLinkedTransaction(db, entryId);
  }
}
