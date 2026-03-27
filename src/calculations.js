// webApp/src/calculations.js

/**
 * Replicates the logic from SimuladorDeCosto.kt
 */
export class CostSimulator {
  constructor(config = {}) {
    this.rendimiento = config.rendimiento || 58.5;
    this.precioVivo = config.precioVivo || 5050.0;
    this.distancia = config.distancia || 0;
    this.porcentajeIIBB = config.porcentajeIIBB || 1.7;
    this.jaulaDobleOrSimple = config.jaulaDobleOrSimple ?? true; // true = Double
    
    this.pesoJaulaDoble = config.pesoJaulaDoble || 21500.0;
    this.pesoJaulaSimple = config.pesoJaulaSimple || 15500.0;
    this.margenGanancia = config.margenGanancia || 1.1;
    this.precioKmSimple = config.precioKmSimple || 2500.0;
    this.precioKmDouble = config.precioKmDouble || 3100.0;
  }

  get precioKm() { return this.jaulaDobleOrSimple ? this.precioKmDouble : this.precioKmSimple; }
  get kgVivos() { return this.jaulaDobleOrSimple ? this.pesoJaulaDoble : this.pesoJaulaSimple; }
  get kgFaena() { return this.kgVivos * (this.rendimiento / 100.0); }
  get costoInicialPorKgCarne() { return this.rendimiento > 0 ? this.precioVivo / (this.rendimiento / 100.0) : 0; }
  get costoFletePorKgCarne() { return this.kgFaena > 0 ? (this.distancia * this.precioKm) / this.kgFaena : 0; }
  get costoFinal() {
    const baseBruta = this.costoInicialPorKgCarne + this.costoFletePorKgCarne;
    const tasaImpuestos = this.margenGanancia * (this.porcentajeIIBB / 100.0);
    const divisor = 1.0 - tasaImpuestos;
    return divisor > 0.0001 ? baseBruta / divisor : baseBruta;
  }
  get facturaVentaPorKgCarne() { return this.costoFinal * this.margenGanancia; }
  get totalVentaEstimada() { return this.facturaVentaPorKgCarne * this.kgFaena; }
  get utilidadTotalEstimada() { return (this.facturaVentaPorKgCarne - this.costoFinal) * this.kgFaena; }
}

/**
 * Logic for Buy, Producer, and Product models
 */
export const BuyLogic = {
  // Product level
  productKgClean(prod) { return (prod.kg || 0) * (1 - (prod.roughing || 0) / 100); },
  productOperation(prod) { return this.productKgClean(prod) * (prod.price || 0); },
  productBillFactura(prod) { 
    const bill = prod.taxes?.bill || { neto: 0, iva: 0 };
    return (bill.neto || 0) + (bill.iva || 0);
  },

  // Producer level
  producerTotalKgClean(p) { return (p.listOfProducts || []).reduce((s, pr) => s + this.productKgClean(pr), 0); },
  producerTotalKgFaena(p) { return (p.listOfProducts || []).reduce((s, pr) => s + (pr.kgFaena || 0), 0); },
  producerTotalOperation(p) { return (p.listOfProducts || []).reduce((s, pr) => s + this.productOperation(pr), 0); },
  producerTotalBillFactura(p) { return (p.listOfProducts || []).reduce((s, pr) => s + this.productBillFactura(pr), 0); },
  
  // Buy level
  totalOperation(buy) { return (buy.listOfProducers || []).reduce((s, p) => s + this.producerTotalOperation(p), 0); },
  totalKgClean(buy) { return (buy.listOfProducers || []).reduce((s, p) => s + this.producerTotalKgClean(p), 0); },
  totalKgFaena(buy) { return (buy.listOfProducers || []).reduce((s, p) => s + this.producerTotalKgFaena(p), 0); },
  totalQuality(buy) { 
    return (buy.listOfProducers || []).reduce((s, p) => s + (p.listOfProducts || []).reduce((ps, pr) => ps + (pr.quantity || 0), 0), 0); 
  },
  
  agentCommissionAmount(buy) { return this.totalOperation(buy) * ((buy.agent?.percent || 0) / 100); },
  totalOperationWithCommission(buy) { return this.totalOperation(buy) + this.agentCommissionAmount(buy); },
  
  avgPrice(buy) { 
    const kg = this.totalKgClean(buy);
    return kg > 0 ? this.totalOperation(buy) / kg : 0;
  },
  avgPriceWithCommission(buy) {
    const kg = this.totalKgClean(buy);
    return kg > 0 ? this.totalOperationWithCommission(buy) / kg : 0;
  },
  generalYield(buy) {
    const kgClean = this.totalKgClean(buy);
    return kgClean > 0 ? this.totalKgFaena(buy) / kgClean : 0;
  },
  facturaOverOperationPercent(buy) {
    const totalOp = this.totalOperation(buy);
    if (totalOp <= 0) return 0;
    const totalFactura = (buy.listOfProducers || []).reduce((s, p) => s + this.producerTotalBillFactura(p), 0);
    return totalFactura / totalOp;
  }
};

/**
 * Logic for Travel model
 */
export const TravelLogic = {
  distanceKm(travel) { return Math.max(0, (travel.kmOnDestination || 0) - (travel.kmOnOrigin || 0)); },
  fleteCost(travel) { return this.distanceKm(travel) * (travel.pricePerKm || 0); },
  travelProfit(travel) {
    const distance = this.distanceKm(travel);
    const truck = travel.truck;
    const isDouble = truck?.trailer?.type === 'DOUBLE';
    const driverRate = isDouble ? (travel.driverPricePerKmDouble || 0) : (travel.driverPricePerKmSimple || 0);
    const driverCost = distance * driverRate;
    const fuelCost = (travel.litersOnPump || 0) * (travel.fuelPrice || 0);
    
    let truckFreightCost = 0;
    if (truck?.isFreightPaid) {
      const freightRate = isDouble ? (travel.simulationFreightPriceDouble || 0) : (travel.simulationFreightPriceSimple || 0);
      truckFreightCost = distance * freightRate;
    }
    
    return this.fleteCost(travel) - driverCost - fuelCost - truckFreightCost;
  }
};
