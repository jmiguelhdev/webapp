// src/adapters/repositories/TravelRepository.js
import { db } from '../../firebase.js';
import * as travelApi from '../api/TravelApi.js';
import * as faenaApi from '../api/FaenaApi.js';

/**
 * Repositorio de viajes logísticos y stock de faena.
 * Implementa la interfaz de persistencia delegando en los módulos especializados de Firestore.
 */
export class FirebaseTravelRepository {
  constructor() {}

  /**
   * Obtiene la lista completa de viajes desde la base de datos IndexedDB local.
   * @param {string} uid - Identificador de usuario.
   * @returns {Promise<Array<Object>>} Lista de viajes.
   */
  async fetchTravels(uid) {
    return travelApi.fetchTravels(db, uid);
  }

  /**
   * Obtiene datos maestros de un tipo específico (ej: TRUCK, DRIVER).
   * @param {string} uid - Identificador de usuario.
   * @param {string} type - Tipo de maestro a filtrar.
   * @returns {Promise<Array<Object>>} Lista de datos maestros.
   */
  async fetchMasterData(uid, type) {
    return travelApi.fetchMasterData(db, uid, type);
  }

  /**
   * Actualiza parcialmente la información de un viaje logístico.
   * @param {string} uid - Identificador de usuario.
   * @param {string|number} travelId - ID del viaje.
   * @param {Object} travelObject - Atributos del viaje a actualizar.
   * @returns {Promise<void>}
   */
  async updateTravel(uid, travelId, travelObject) {
    await travelApi.updateTravel(db, uid, travelId, travelObject);
  }

  /**
   * Guarda o crea un viaje logístico en Firestore.
   * @param {string} uid - Identificador de usuario.
   * @param {Object} travelObject - Parámetros del viaje a guardar.
   * @returns {Promise<void>}
   */
  async saveTravel(uid, travelObject) {
    await travelApi.saveTravel(db, uid, travelObject);
  }

  /**
   * Elimina un viaje logístico de la base de datos.
   * @param {string} uid - Identificador de usuario.
   * @param {string|number} travelId - ID del viaje a eliminar.
   * @returns {Promise<void>}
   */
  async deleteTravel(uid, travelId) {
    await travelApi.deleteTravel(db, uid, travelId);
  }

  /**
   * Guarda los detalles de faena/garrones asociados a un viaje en Firestore.
   * @param {string} uid - Identificador de usuario.
   * @param {Array<Object>} faenaRecords - Colección de garrones a guardar.
   * @returns {Promise<void>}
   */
  async saveFaenaDetalle(uid, faenaRecords) {
    await faenaApi.saveFaenaDetalle(db, uid, faenaRecords);
  }

  /**
   * Obtiene la lista total del stock de medias reses colgadas en cámaras frigoríficas.
   * @param {string} uid - Identificador de usuario.
   * @returns {Promise<Array<Object>>} Lista de reses en stock.
   */
  async getFaenaStock(uid) {
    return faenaApi.fetchFaenaDetalle(db, uid);
  }

  /**
   * Despacha un lote de garrones, actualizando su estado a DISPATCHED y aplicando fecha y destino.
   * @param {string} uid - Identificador de usuario.
   * @param {Array<string>} recordIds - Lista de IDs de garrones a despachar.
   * @param {string} destination - Nombre o id del destino (cliente).
   * @returns {Promise<void>}
   */
  async dispatchFaenas(uid, recordIds, destination) {
    const updateData = {
      status: 'DISPATCHED',
      destination,
      dispatchDate: Date.now(),
      deleteAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // TTL cleanup in 90 days
    };
    await faenaApi.updateFaenasStatus(db, uid, recordIds, updateData);
  }

  /**
   * Prepara un borrador de despacho, actualizando el estado de los garrones.
   * @param {string} uid - Identificador de usuario.
   * @param {Array<string>} recordIds - Colección de IDs de garrones.
   * @param {Object} updateData - Atributos de actualización de estado y precios.
   * @returns {Promise<void>}
   */
  async prepareFaenas(uid, recordIds, updateData) {
    await faenaApi.updateFaenasStatus(db, uid, recordIds, updateData);
  }

  /**
   * Traslada un conjunto de garrones de faena a una cámara de frío específica.
   * @param {string} uid - Identificador de usuario.
   * @param {Array<Object>} recordsInfo - Lista de reses a mover con sus datos.
   * @param {string|number} camaraId - ID de la cámara de destino.
   * @returns {Promise<void>}
   */
  async moveFaenasToCamara(uid, recordsInfo, camaraId) {
    await faenaApi.moveFaenasToCamara(db, uid, recordsInfo, camaraId);
  }

  /**
   * Comprueba si los detalles de una faena ya han sido importados previamente para evitar duplicados.
   * @param {string} uid - Identificador de usuario.
   * @param {string} fileName - Nombre del archivo PDF procesado.
   * @returns {Promise<boolean>} Verdadero si la faena ya existe.
   */
  async checkIfFaenaExists(uid, fileName) {
    return faenaApi.checkIfFaenaExists(db, uid, fileName);
  }

  /**
   * Valida si un número de tropa ya está registrado en base de datos.
   * @param {string} uid - Identificador de usuario.
   * @param {string|number} tropa - Número de tropa a validar.
   * @returns {Promise<boolean>} Verdadero si la tropa ya existe.
   */
  async checkIfTropaExists(uid, tropa) {
    return faenaApi.checkIfTropaExists(db, uid, tropa);
  }

  /**
   * Registra una carga de achuras colgada en el inventario.
   * @param {string} uid - Identificador de usuario.
   * @param {string} tropa - Número de tropa del lote.
   * @param {number} date - Timestamp de fecha de faena.
   * @param {number} quantity - Cantidad de juegos de achuras.
   * @returns {Promise<void>}
   */
  async addAchurasBatch(uid, tropa, date, quantity) {
    await faenaApi.addAchurasBatch(db, uid, tropa, date, quantity);
  }

  /**
   * Obtiene la lista del stock de achuras disponibles en cámara.
   * @param {string} uid - Identificador de usuario.
   * @returns {Promise<Array<Object>>} Lista de lotes de achuras.
   */
  async fetchAchurasStock(uid) {
    return faenaApi.fetchAchurasStock(db, uid);
  }

  /**
   * Registra el consumo/salida de una cantidad de juegos de achuras.
   * @param {string} uid - Identificador de usuario.
   * @param {number} quantity - Cantidad a consumir del stock total.
   * @returns {Promise<void>}
   */
  async consumeAchuras(uid, quantity) {
    await faenaApi.consumeAchuras(db, uid, quantity);
  }

  /**
   * Se suscribe en tiempo real a los cambios en la colección de viajes.
   * @param {string} uid - Identificador de usuario.
   * @param {Function} callback - Callback asíncrono para notificar la actualización del listado.
   * @param {Function} onError - Callback para reportar errores en la conexión del websocket.
   * @returns {Function} Función para cancelar la suscripción en tiempo real (unsubscribe).
   */
  subscribeTravels(uid, callback, onError) {
    return travelApi.subscribeToTravels(db, uid, callback, onError);
  }

  /**
   * Registra un lote de materia prima en la base de datos contable/logística.
   * @param {Object} batch - Atributos de la materia prima.
   * @returns {Promise<void>}
   */
  async saveRawMaterialBatch(batch) {
    await travelApi.saveRawMaterialBatch(db, batch);
  }

  /**
   * Ejecuta la confirmación y facturación de un borrador de despacho a un cliente en una transacción atómica.
   * @param {string} uid - Identificador de usuario.
   * @param {Object} dispatchData - Datos consolidados del despacho y cliente.
   * @returns {Promise<void>}
   */
  async executeUnifiedDispatch(uid, dispatchData) {
    await faenaApi.executeUnifiedDispatch(db, uid, dispatchData);
  }

  /**
   * Modifica la categoría comercial de un garrón.
   * @param {string} id - ID del garrón.
   * @param {string} category - Nombre de la nueva categoría comercial.
   * @param {string} comments - Motivo descriptivo del cambio para auditoría.
   * @returns {Promise<void>}
   */
  async updateFaenaCategory(id, category, comments) {
    await faenaApi.updateFaenaCategory(db, id, category, comments);
  }

  /**
   * Actualiza el cliente y precio final asignados a un garrón específico.
   * @param {string} uid - Identificador de usuario.
   * @param {string} carcassId - ID del garrón.
   * @param {string} newDestination - Nuevo cliente asignado.
   * @param {number} newPrice - Nuevo precio final asignado.
   * @returns {Promise<void>}
   */
  async updateCarcassDestination(uid, carcassId, newDestination, newPrice) {
    await faenaApi.updateCarcassDestination(db, uid, carcassId, newDestination, newPrice);
  }
}
