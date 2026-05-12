// src/adapters/repositories/TravelRepository.js
import { db } from '../../firebase.js';
import * as travelsApi from '../../api/travelsApi.js';
import * as faenaApi from '../../api/faenaApi.js';

export class FirebaseTravelRepository {
  constructor() {}

  async fetchTravels(uid) {
    return travelsApi.fetchTravels(db, uid);
  }

  async fetchMasterData(uid, type) {
    return travelsApi.fetchMasterData(db, uid, type);
  }

  async updateTravel(uid, travelId, travelObject) {
    await travelsApi.updateTravel(db, uid, travelId, travelObject);
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
}
