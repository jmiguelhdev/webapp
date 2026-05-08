// src/adapters/repositories/EstablishmentRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class EstablishmentRepository {
  constructor() {}

  async getEstablishments(forceRefresh = false) {
    return api.fetchEstablishments(db);
  }

  async saveEstablishment(establishment) {
    return api.saveEstablishment(db, establishment);
  }

  async deleteEstablishment(id) {
    return api.deleteEstablishment(db, id);
  }

  async getEmployees(establishmentId, forceRefresh = false) {
    return api.fetchEmployees(db, establishmentId);
  }

  async saveEmployee(establishmentId, employee) {
    return api.saveEmployee(db, establishmentId, employee);
  }

  async deleteEmployee(establishmentId, employeeId) {
    return api.deleteEmployee(db, establishmentId, employeeId);
  }
}
