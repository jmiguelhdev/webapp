// src/domain/entities/CostSimulator.js

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
  
  get costoIIBB() { return this.facturaVentaPorKgCarne * (this.porcentajeIIBB / 100.0); }
  
  get utilidadPorKg() { return this.facturaVentaPorKgCarne - this.costoFinal; }
  
  get totalVentaEstimada() { return this.facturaVentaPorKgCarne * this.kgFaena; }
  
  get utilidadTotalEstimada() { return this.utilidadPorKg * this.kgFaena; }
}
