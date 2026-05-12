// src/domain/entities/LogisticsModels.js

/**
 * Representa a un Conductor (Driver) de camión.
 */
export class Driver {
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.name = data.name || '';
    this.dni = data.dni || '';
    this.license = data.license || '';
  }
}

/**
 * Representa un Acoplado o Jaula (Trailer) enganchado al camión.
 */
export class Trailer {
  /**
   * @param {Object} data Datos del acoplado.
   * @param {string} [data.type='SIMPLE'] Tipo de acoplado (SIMPLE o DOUBLE).
   */
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.name = data.name || '';
    this.licensePlate = data.licensePlate || '';
    this.vtvExpiration = data.vtvExpiration || '';
    this.senasaExpiration = data.senasaExpiration || '';
    this.type = data.type || 'SIMPLE'; // 'SIMPLE' or 'DOUBLE'
  }
}

/**
 * Representa a un Camión (Truck) de transporte logístico.
 */
export class Truck {
  /**
   * @param {Object} data Datos del camión.
   */
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.name = data.name || '';
    this.licensePlate = data.licensePlate || '';
    this.vtvExpiration = data.vtvExpiration || '';
    this.insuranceExpiration = data.insuranceExpiration || '';
    this.driver = data.driver ? new Driver(data.driver) : null;
    this.trailer = data.trailer ? new Trailer(data.trailer) : null;
    this.isFreightPaid = data.isFreightPaid || false;
    this.updatedAt = data.updatedAt || Date.now();
    this.isDirty = data.isDirty !== undefined ? data.isDirty : false;
    this.isDeleted = data.isDeleted || false;
  }
}

/**
 * Representa un Gasto (Expense) operativo durante un viaje.
 */
export class Expense {
  /**
   * @param {Object} data Datos del gasto.
   * @param {number} [data.amount] Monto del gasto.
   * @param {boolean} [data.isReimbursable=true] Indica si es reintegrable.
   */
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.travelId = data.travelId || 0;
    this.description = data.description || '';
    this.amount = data.amount || 0;
    this.category = data.category || '';
    this.date = data.date || new Date().toISOString().split('T')[0];
    this.isReimbursable = data.isReimbursable !== undefined ? data.isReimbursable : true;
  }
}

/**
 * Representa un Viaje (Travel) o Carta de Porte logístico completo.
 */
export class Travel {
  /**
   * @param {Object} data Datos del viaje.
   * @param {string} [data.status='DRAFT'] Estado actual del viaje.
   */
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.status = data.status || 'DRAFT'; // DRAFT, ACTIVE, COMPLETED
    this.truck = data.truck ? new Truck(data.truck) : null;
    this.kmOnOrigin = data.kmOnOrigin || 0;
    this.kmOnDestination = data.kmOnDestination || 0;
    this.kmOnPump = data.kmOnPump || 0;
    this.litersOnPump = data.litersOnPump || 0;
    this.date = data.date || new Date().toISOString().split('T')[0];
    this.description = data.description || '';
    this.pricePerKm = data.pricePerKm || 0;
    this.driverPricePerKmSimple = data.driverPricePerKmSimple || 0;
    this.driverPricePerKmDouble = data.driverPricePerKmDouble || 0;
    this.fuelPrice = data.fuelPrice || 0;
    this.simulationFreightPriceSimple = data.simulationFreightPriceSimple || 0;
    this.simulationFreightPriceDouble = data.simulationFreightPriceDouble || 0;
    
    // Existing complex fields (kept for compatibility with KMP)
    this.buy = data.buy || null; 
    this.kgFaenaTotal = data.kgFaenaTotal || 0;
    this.coefImposturesSobreLaVenta = data.coefImposturesSobreLaVenta || 1.0;
    this.yieldCorrectionKg = data.yieldCorrectionKg || 0;
    this.yieldCorrectionAmount = data.yieldCorrectionAmount || 0;

    this.expenses = (data.expenses || []).map(e => new Expense(e));
    this.updatedAt = data.updatedAt || Date.now();
    this.isDirty = data.isDirty !== undefined ? data.isDirty : false;
  }

  get distanceKm() {
    return Math.max(0, this.kmOnDestination - this.kmOnOrigin);
  }

  get driverCost() {
    if (!this.truck || !this.truck.trailer) return 0;
    const rate = this.truck.trailer.type === 'DOUBLE' 
      ? this.driverPricePerKmDouble 
      : this.driverPricePerKmSimple;
    return this.distanceKm * rate;
  }

  get fuelCost() {
    return this.litersOnPump * this.fuelPrice;
  }

  calculateFuelEfficiency(previousKmOnPump) {
    if (this.litersOnPump <= 0) return 0;
    const diff = this.kmOnPump - previousKmOnPump;
    return diff > 0 ? diff / this.litersOnPump : 0;
  }
}

export class Producer {
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.name = data.name || '';
    this.phone = data.phone || '';
    this.cuit = data.cuit || '';
    this.cbu = data.cbu || '';
    this.listOfProducts = data.listOfProducts || [];
    this.usageCount = data.usageCount || 0;
  }
}

export class Agent {
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.name = data.name || '';
    this.phone = data.phone || '';
    this.percent = Number(data.percent) || 0;
  }
}
