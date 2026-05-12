// src/adapters/repositories/EstablishmentRepository.js
import { db } from '../../firebase.js';
import * as productionApi from '../../api/productionApi.js';

export class EstablishmentRepository {
  constructor() {}

  async getEstablishments(forceRefresh = false) {
    return productionApi.fetchEstablishments(db);
  }

  async saveEstablishment(establishment) {
    return productionApi.saveEstablishment(db, establishment);
  }

  async deleteEstablishment(id) {
    return productionApi.deleteEstablishment(db, id);
  }

  async getEmployees(establishmentId, forceRefresh = false) {
    return productionApi.fetchEmployees(db, establishmentId);
  }

  async saveEmployee(establishmentId, employee) {
    return productionApi.saveEmployee(db, establishmentId, employee);
  }

  async deleteEmployee(establishmentId, employeeId) {
    return productionApi.deleteEmployee(db, establishmentId, employeeId);
  }
}
