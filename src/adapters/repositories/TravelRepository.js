// src/adapters/repositories/TravelRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class FirebaseTravelRepository {
  constructor() {
    this.travelsCache = null;
    this.faenaCache = null;
    this.achurasCache = null;
  }

  async fetchTravels(uid) {
    if (this.travelsCache) return this.travelsCache;
    try {
      const travels = await api.fetchTravels(db, uid);
      // Actualizar caché local (fallback) y de memoria
      localStorage.setItem(`travels_${uid}`, JSON.stringify(travels));
      this.travelsCache = travels;
      return travels;
    } catch (error) {
      console.warn("Error de red, cargando desde caché local:", error);
      const cached = localStorage.getItem(`travels_${uid}`);
      if (cached) {
        this.travelsCache = JSON.parse(cached);
        return this.travelsCache;
      }
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
    this.travelsCache = null;
  }

  async saveFaenaDetalle(uid, faenaRecords) {
    await api.saveFaenaDetalle(db, uid, faenaRecords);
    this.faenaCache = null;
  }

  async getFaenaStock(uid) {
    if (this.faenaCache) return this.faenaCache;
    this.faenaCache = await api.fetchFaenaDetalle(db, uid);
    return this.faenaCache;
  }

  async dispatchFaenas(uid, recordIds, destination) {
    const updateData = {
      status: 'DISPATCHED',
      destination,
      dispatchDate: Date.now(),
      deleteAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // TTL cleanup in 90 days
    };
    await api.updateFaenasStatus(db, uid, recordIds, updateData);
    this.faenaCache = null;
  }

  async prepareFaenas(uid, recordIds, updateData) {
    await api.updateFaenasStatus(db, uid, recordIds, updateData);
    this.faenaCache = null;
  }

  async moveFaenasToCamara(uid, recordsInfo, camaraId) {
    await api.moveFaenasToCamara(db, uid, recordsInfo, camaraId);
    this.faenaCache = null;
  }

  async checkIfFaenaExists(uid, fileName) {
    return api.checkIfFaenaExists(db, uid, fileName);
  }

  async checkIfTropaExists(uid, tropa) {
    return api.checkIfTropaExists(db, uid, tropa);
  }

  async addAchurasBatch(uid, tropa, date, quantity) {
    await api.addAchurasBatch(db, uid, tropa, date, quantity);
    this.achurasCache = null;
  }

  async fetchAchurasStock(uid) {
    if (this.achurasCache) return this.achurasCache;
    this.achurasCache = await api.fetchAchurasStock(db, uid);
    return this.achurasCache;
  }

  async consumeAchuras(uid, quantity) {
    await api.consumeAchuras(db, uid, quantity);
    this.achurasCache = null;
  }
}
