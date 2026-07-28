import { db } from '../../firebase.js';
import * as accountingApi from '../api/AccountingApi.js';
import * as clientApi from '../api/ClientApi.js';
import * as travelApi from '../api/TravelApi.js';
import * as establishmentApi from '../api/EstablishmentApi.js';
import * as cashExtractionApi from '../api/CashExtractionApi.js';

/**
 * Repositorio para la gestión contable de asientos y vinculaciones.
 * Implementa la interfaz de acceso a datos para las cajas.
 */
export class AccountingRepository {
  /**
   * @param {string} [collectionName='accounting_entries'] - Nombre de la colección de Firestore.
   */
  constructor(collectionName = 'accounting_entries') {
    this.collectionName = collectionName;
  }

  /**
   * Obtiene la lista completa de asientos contables.
   * @param {string} uid - ID del usuario de la sesión.
   * @returns {Promise<Array<Object>>} Lista de asientos contables.
   */
  async fetchEntries(uid) {
    return accountingApi.fetchAccountingEntries(db, uid, this.collectionName);
  }

  /**
   * Guarda o actualiza un asiento contable.
   * @param {string} uid - ID del usuario.
   * @param {Object} entry - Datos del asiento contable.
   * @returns {Promise<string>} ID del asiento guardado.
   */
  async saveEntry(uid, entry) {
    return accountingApi.saveAccountingEntry(db, uid, entry, this.collectionName);
  }

  /**
   * Elimina un asiento contable de Firestore.
   * @param {string|number} entryId - ID del asiento.
   * @returns {Promise<void>}
   */
  async deleteEntry(entryId) {
    return accountingApi.deleteAccountingEntry(db, entryId, this.collectionName);
  }

  /**
   * Obtiene la lista de extracciones de efectivo desde Firestore con respaldo en IndexedDB local.
   * @returns {Promise<Array<Object>>} Lista de extracciones.
   */
  async getCashExtractions() {
    return cashExtractionApi.fetchCashExtractions(db);
  }

  /**
   * Actualiza el estado de una extracción en Firestore e IndexedDB local.
   * @param {string} extractionId - ID de la extracción.
   * @param {string} status - Estado ('PENDING', 'ACCEPTED', etc.).
   * @param {string|null} accountingEntryId - ID del asiento de ingreso generado.
   * @returns {Promise<void>}
   */
  async updateExtractionStatus(extractionId, status, accountingEntryId = null) {
    return cashExtractionApi.updateExtractionStatus(db, extractionId, status, accountingEntryId);
  }

  /**
   * Obtiene la lista completa de clientes cargados.
   * @returns {Promise<Array<Object>>} Lista de clientes.
   */
  async getClients() {
    return clientApi.fetchClients(db);
  }

  /**
   * Obtiene los viajes del usuario para extraer información de productores.
   * @param {string} uid - ID del usuario.
   * @returns {Promise<Array<Object>>} Lista de viajes.
   */
  async getTravels(uid) {
    return travelApi.fetchTravels(db, uid);
  }

  /**
   * Obtiene la lista de establecimientos/sucursales.
   * @returns {Promise<Array<Object>>} Lista de sucursales.
   */
  async getEstablishments() {
    return establishmentApi.fetchEstablishments(db);
  }

  /**
   * Obtiene los empleados de un establecimiento.
   * @param {string|number} establishmentId - ID del establecimiento.
   * @returns {Promise<Array<Object>>} Lista de empleados.
   */
  async getEmployees(establishmentId) {
    return establishmentApi.fetchEmployees(db, establishmentId);
  }

  /**
   * Desvincula y elimina la transacción contable cruzada del módulo de cuenta corriente.
   * @param {string} entryId - ID del asiento contable de origen.
   * @returns {Promise<void>}
   */
  async removeLinkedTransaction(entryId) {
    return accountingApi.removeLinkedTransaction(db, entryId);
  }
}

