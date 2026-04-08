// src/adapters/repositories/TravelRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class FirebaseTravelRepository {
  async fetchTravels(uid) {
    try {
      const travels = await api.fetchTravels(db, uid);
      // Actualizar caché
      localStorage.setItem(`travels_${uid}`, JSON.stringify(travels));
      return travels;
    } catch (error) {
      console.warn("Error de red, cargando desde caché local:", error);
      const cached = localStorage.getItem(`travels_${uid}`);
      if (cached) return JSON.parse(cached);
      throw error;
    }
  }

  async fetchMasterData(uid, type) {
    return api.fetchMasterData(db, uid, type);
  }

  async updateTravel(uid, travelId, travelObject) {
    await api.updateTravel(db, uid, travelId, travelObject);
    // Clear cache to force reload
    localStorage.removeItem(`travels_${uid}`);
  }

  async saveFaenaDetalle(uid, faenaRecords) {
    await api.saveFaenaDetalle(db, uid, faenaRecords);
  }

  async getFaenaStock(uid) {
    return await api.fetchFaenaDetalle(db, uid);
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
}
