// src/adapters/repositories/TravelRepository.js
import { db } from '../../firebase.js';
import * as travelApi from '../../api/TravelApi.js';
import * as faenaApi from '../../api/FaenaApi.js';

export class FirebaseTravelRepository {
  constructor() {}

  async fetchTravels(uid) {
    return travelApi.fetchTravels(db, uid);
  }

  async fetchMasterData(uid, type) {
    return travelApi.fetchMasterData(db, uid, type);
  }

  async updateTravel(uid, travelId, travelObject) {
    await travelApi.updateTravel(db, uid, travelId, travelObject);
  }

  async saveTravel(uid, travelObject) {
    await travelApi.saveTravel(db, uid, travelObject);
  }

  async deleteTravel(uid, travelId) {
    await travelApi.deleteTravel(db, uid, travelId);
  }

  async saveFaenaDetalle(uid, faenaRecords) {
    await faenaApi.saveFaenaDetalle(db, uid, faenaRecords);
  }

  async getFaenaStock(uid) {
    return faenaApi.fetchFaenaDetalle(db, uid);
  }

  async dispatchFaenas(uid, recordIds, destination) {
    const updateData = {
      status: 'DISPATCHED',
      destination,
      dispatchDate: Date.now(),
      deleteAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // TTL cleanup in 90 days
    };
    await faenaApi.updateFaenasStatus(db, uid, recordIds, updateData);
  }

  async prepareFaenas(uid, recordIds, updateData) {
    await faenaApi.updateFaenasStatus(db, uid, recordIds, updateData);
  }

  async moveFaenasToCamara(uid, recordsInfo, camaraId) {
    await faenaApi.moveFaenasToCamara(db, uid, recordsInfo, camaraId);
  }

  async checkIfFaenaExists(uid, fileName) {
    return faenaApi.checkIfFaenaExists(db, uid, fileName);
  }

  async checkIfTropaExists(uid, tropa) {
    return faenaApi.checkIfTropaExists(db, uid, tropa);
  }

  async addAchurasBatch(uid, tropa, date, quantity) {
    await faenaApi.addAchurasBatch(db, uid, tropa, date, quantity);
  }

  async fetchAchurasStock(uid) {
    return faenaApi.fetchAchurasStock(db, uid);
  }

  async consumeAchuras(uid, quantity) {
    await faenaApi.consumeAchuras(db, uid, quantity);
  }

  subscribeTravels(uid, callback, onError) {
    return travelApi.subscribeToTravels(db, uid, callback, onError);
  }

  async saveRawMaterialBatch(batch) {
    await travelApi.saveRawMaterialBatch(db, batch);
  }

  async executeUnifiedDispatch(uid, dispatchData) {
    await faenaApi.executeUnifiedDispatch(db, uid, dispatchData);
  }

  async updateFaenaCategory(id, category, comments) {
    await faenaApi.updateFaenaCategory(db, id, category, comments);
  }

  async updateCarcassDestination(uid, carcassId, newDestination, newPrice) {
    await faenaApi.updateCarcassDestination(db, uid, carcassId, newDestination, newPrice);
  }
}
