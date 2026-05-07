// src/adapters/repositories/EstablishmentRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class EstablishmentRepository {
  constructor() {
    this.establishmentsCache = null;
    this.employeesCache = {}; // { [establishmentId]: [employees...] }
  }

  async getEstablishments(forceRefresh = false) {
    const cacheKey = 'establishments_list';
    
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        this.establishmentsCache = JSON.parse(cached);
        return this.establishmentsCache;
      }
    }

    this.establishmentsCache = await api.fetchEstablishments(db);
    localStorage.setItem(cacheKey, JSON.stringify(this.establishmentsCache));
    return this.establishmentsCache;
  }

  async saveEstablishment(establishment) {
    const id = await api.saveEstablishment(db, establishment);
    // Invalidate cache
    localStorage.removeItem('establishments_list');
    this.establishmentsCache = null;
    return id;
  }

  async deleteEstablishment(id) {
    await api.deleteEstablishment(db, id);
    // Invalidate cache
    localStorage.removeItem('establishments_list');
    this.establishmentsCache = null;
    delete this.employeesCache[id];
  }

  async getEmployees(establishmentId, forceRefresh = false) {
    const cacheKey = `employees_${establishmentId}`;
    
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        this.employeesCache[establishmentId] = JSON.parse(cached);
        return this.employeesCache[establishmentId];
      }
    }

    const employees = await api.fetchEmployees(db, establishmentId);
    this.employeesCache[establishmentId] = employees;
    localStorage.setItem(cacheKey, JSON.stringify(employees));
    return employees;
  }

  async saveEmployee(establishmentId, employee) {
    const id = await api.saveEmployee(db, establishmentId, employee);
    // Invalidate specific establishment's employee cache
    localStorage.removeItem(`employees_${establishmentId}`);
    delete this.employeesCache[establishmentId];
    return id;
  }

  async deleteEmployee(establishmentId, employeeId) {
    await api.deleteEmployee(db, establishmentId, employeeId);
    // Invalidate specific establishment's employee cache
    localStorage.removeItem(`employees_${establishmentId}`);
    delete this.employeesCache[establishmentId];
  }
}
