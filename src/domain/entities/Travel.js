// src/domain/entities/Travel.js
import { Buy } from './Buy.js';

export class Travel {
  constructor(data = {}) {
    this._raw = data; // Preserve raw payload to avoid data loss on updates
    // firebaseId = Firestore document ID (string, e.g. "AbCdEf").
    // data.id = KMP internal numeric ID (e.g. 15). We MUST use firebaseId for Firestore operations.
    this.id = data.firebaseId || String(data.id || '');

    this.date = data.date || '';
    this.description = data.description || '';
    this.status = data.status || 'DRAFT'; // DRAFT, ACTIVE, COMPLETED
    this.truck = data.truck || { name: '' };
    this.kmOnOrigin = data.kmOnOrigin || 0;
    this.kmOnDestination = data.kmOnDestination || 0;
    this.pricePerKm = data.pricePerKm || 0;
    this.litersOnPump = data.litersOnPump || 0;
    this.fuelPrice = data.fuelPrice || 0;

    const buyData = data.buy || {};
    if (data.reduce !== undefined) buyData.reduce = data.reduce;
    this.buy = data.buy ? new Buy(buyData) : (data.reduce !== undefined ? new Buy({ reduce: data.reduce }) : null);
  }

  get distanceKm() {
    return Math.max(0, this.kmOnDestination - this.kmOnOrigin);
  }

  get fleteCost() {
    return this.distanceKm * this.pricePerKm;
  }

  get isCompleted() {
    const s = String(this.status || '').toUpperCase();
    return (s === 'ACTIVE' || s === 'ACTIVO' || s === 'COMPLETED' || s === 'FINALIZADO') && s !== 'DRAFT' && s !== 'BORRADOR';
  }
}
