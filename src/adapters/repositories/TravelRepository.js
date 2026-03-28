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
}
