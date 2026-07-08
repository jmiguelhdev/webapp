// src/adapters/repositories/CheckRepository.js
import { db } from '../../firebase.js';
import * as checkApi from '../api/CheckApi.js';
import * as clientApi from '../api/ClientApi.js';
import * as travelApi from '../api/TravelApi.js';

/**
 * Repositorio para la gestión de la cartera de cheques diferidos.
 * Centraliza las consultas, inserciones y suscripciones en tiempo real del portfolio.
 */
export class CheckRepository {
  constructor() {}

  /**
   * Obtiene la lista de cheques del usuario.
   * @param {string} uid - ID del usuario.
   * @returns {Promise<Array<Object>>} Lista de cheques.
   */
  async fetchChecks(uid) {
    return checkApi.fetchCheckOperations(db, uid);
  }

  /**
   * Guarda o actualiza un cheque diferido.
   * @param {string} uid - ID del usuario.
   * @param {Object} operation - Parámetros del cheque.
   * @returns {Promise<string>} ID del cheque guardado.
   */
  async saveCheck(uid, operation) {
    return checkApi.saveCheckOperation(db, uid, operation);
  }

  /**
   * Elimina un cheque del registro de base de datos.
   * @param {string|number} operationId - ID del cheque a eliminar.
   * @returns {Promise<void>}
   */
  async deleteCheck(operationId) {
    return checkApi.deleteCheckOperation(db, operationId);
  }

  /**
   * Obtiene la lista unificada de clientes cargados.
   * @returns {Promise<Array<Object>>} Lista de clientes.
   */
  async getContacts() {
    return clientApi.fetchClients(db);
  }

  /**
   * Obtiene los viajes logísticos para extracción de productores.
   * @param {string} uid - ID de usuario.
   * @returns {Promise<Array<Object>>} Lista de viajes.
   */
  async getTravels(uid) {
    return travelApi.fetchTravels(db, uid);
  }

  /**
   * Abre una suscripción WebSocket en tiempo real para recibir actualizaciones de la cartera de cheques.
   * @param {string} uid - ID de usuario.
   * @param {Function} callback - Callback asíncrono para notificar actualizaciones.
   * @param {Function} onError - Callback para reportar errores.
   * @returns {Function} Función para dar de baja la suscripción.
   */
  subscribeChecks(uid, callback, onError) {
    return checkApi.subscribeToCheckOperations(db, uid, callback, onError);
  }
}
