// src/adapters/repositories/EstablishmentRepository.js
import { db } from '../../firebase.js';
import * as establishmentApi from '../../api/EstablishmentApi.js';

export class EstablishmentRepository {
  constructor() {}

  async getEstablishments(forceRefresh = false) {
    return establishmentApi.fetchEstablishments(db);
  }

  async saveEstablishment(establishment) {
    return establishmentApi.saveEstablishment(db, establishment);
  }

  async deleteEstablishment(id) {
    return establishmentApi.deleteEstablishment(db, id);
  }

  async getEmployees(establishmentId, forceRefresh = false) {
    return establishmentApi.fetchEmployees(db, establishmentId);
  }

  async saveEmployee(establishmentId, employee) {
    return establishmentApi.saveEmployee(db, establishmentId, employee);
  }

  async deleteEmployee(establishmentId, employeeId) {
    return establishmentApi.deleteEmployee(db, establishmentId, employeeId);
  }
}
