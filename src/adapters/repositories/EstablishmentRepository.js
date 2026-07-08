// src/adapters/repositories/EstablishmentRepository.js
import { db } from '../../firebase.js';
import * as establishmentApi from '../api/EstablishmentApi.js';

/**
 * Repositorio para la administración de establecimientos/sucursales y personal de campo.
 */
export class EstablishmentRepository {
  constructor() {}

  /**
   * Obtiene todos los establecimientos registrados.
   * @param {boolean} [forceRefresh=false] - Ignorar caché si aplica.
   * @returns {Promise<Array<Object>>} Lista de establecimientos.
   */
  async getEstablishments(forceRefresh = false) {
    return establishmentApi.fetchEstablishments(db);
  }

  /**
   * Guarda o actualiza un establecimiento.
   * @param {Object} establishment - Datos del establecimiento.
   * @returns {Promise<void>}
   */
  async saveEstablishment(establishment) {
    return establishmentApi.saveEstablishment(db, establishment);
  }

  /**
   * Elimina un establecimiento.
   * @param {string|number} id - ID del establecimiento.
   * @returns {Promise<void>}
   */
  async deleteEstablishment(id) {
    return establishmentApi.deleteEstablishment(db, id);
  }

  /**
   * Obtiene los empleados de una sucursal.
   * @param {string|number} establishmentId - ID de la sucursal.
   * @param {boolean} [forceRefresh=false] - Ignorar caché.
   * @returns {Promise<Array<Object>>} Lista de empleados.
   */
  async getEmployees(establishmentId, forceRefresh = false) {
    return establishmentApi.fetchEmployees(db, establishmentId);
  }

  /**
   * Guarda o actualiza la ficha de un empleado en la sucursal especificada.
   * @param {string|number} establishmentId - ID de la sucursal.
   * @param {Object} employee - Datos del empleado.
   * @returns {Promise<void>}
   */
  async saveEmployee(establishmentId, employee) {
    return establishmentApi.saveEmployee(db, establishmentId, employee);
  }

  /**
   * Elimina la ficha de un empleado.
   * @param {string|number} establishmentId - ID de la sucursal.
   * @param {string|number} employeeId - ID del empleado.
   * @returns {Promise<void>}
   */
  async deleteEmployee(establishmentId, employeeId) {
    return establishmentApi.deleteEmployee(db, establishmentId, employeeId);
  }
}
