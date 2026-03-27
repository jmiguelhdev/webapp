// src/adapters/repositories/TravelRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class FirebaseTravelRepository {
  async fetchTravels(uid) {
    return api.fetchTravels(db, uid);
  }

  async fetchMasterData(uid, type) {
    return api.fetchMasterData(db, uid, type);
  }
}
