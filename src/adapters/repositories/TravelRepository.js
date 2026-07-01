// src/adapters/repositories/TravelRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class FirebaseTravelRepository {
  constructor() {}

  async fetchTravels(uid) {
    return api.fetchTravels(db, uid);
  }

  async fetchMasterData(uid, type) {
    return api.fetchMasterData(db, uid, type);
  }

  async updateTravel(uid, travelId, travelObject) {
    await api.updateTravel(db, uid, travelId, travelObject);
  }

  async saveTravel(uid, travelObject) {
    await api.saveTravel(db, uid, travelObject);
  }

  async deleteTravel(uid, travelId) {
    await api.deleteTravel(db, uid, travelId);
  }


  async saveFaenaDetalle(uid, faenaRecords) {
    await api.saveFaenaDetalle(db, uid, faenaRecords);
  }

  async getFaenaStock(uid) {
    return api.fetchFaenaDetalle(db, uid);
  }

  async dispatchFaenas(uid, recordIds, destination) {
    const updateData = {
      status: 'DISPATCHED',
      destination,
      dispatchDate: Date.now(),
      deleteAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // TTL cleanup in 90 days
    };
    await api.updateFaenasStatus(db, uid, recordIds, updateData);
  }

  async prepareFaenas(uid, recordIds, updateData) {
    await api.updateFaenasStatus(db, uid, recordIds, updateData);
  }

  async moveFaenasToCamara(uid, recordsInfo, camaraId) {
    await api.moveFaenasToCamara(db, uid, recordsInfo, camaraId);
  }

  async checkIfFaenaExists(uid, fileName) {
    return api.checkIfFaenaExists(db, uid, fileName);
  }

  async checkIfTropaExists(uid, tropa) {
    return api.checkIfTropaExists(db, uid, tropa);
  }

  async addAchurasBatch(uid, tropa, date, quantity) {
    await api.addAchurasBatch(db, uid, tropa, date, quantity);
  }

  async fetchAchurasStock(uid) {
    return api.fetchAchurasStock(db, uid);
  }

  async consumeAchuras(uid, quantity) {
    await api.consumeAchuras(db, uid, quantity);
  }

  subscribeTravels(uid, callback, onError) {
    return api.subscribeToTravels(db, uid, callback, onError);
  }

  async saveRawMaterialBatch(batch) {
    await api.saveRawMaterialBatch(db, batch);
  }

  async executeUnifiedDispatch(uid, dispatchData) {
    await api.executeUnifiedDispatch(db, uid, dispatchData);
  }

  async updateFaenaCategory(id, category, comments) {
    await api.updateFaenaCategory(db, id, category, comments);
  }
}



