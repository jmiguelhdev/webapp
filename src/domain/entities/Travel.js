// src/domain/entities/Travel.js
import { Buy } from './Buy.js';

export class Travel {
  constructor(data = {}) {
    this.id = data.id || data.firebaseId || '';
    this.date = data.date || '';
    this.description = data.description || '';
    this.status = data.status || 'DRAFT'; // DRAFT, ACTIVE, COMPLETED
    this.truck = data.truck || { name: '' };
    this.kmOnOrigin = data.kmOnOrigin || 0;
    this.kmOnDestination = data.kmOnDestination || 0;
    this.pricePerKm = data.pricePerKm || 0;
    this.litersOnPump = data.litersOnPump || 0;
    this.fuelPrice = data.fuelPrice || 0;

    this.buy = data.buy ? new Buy(data.buy) : null;
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
