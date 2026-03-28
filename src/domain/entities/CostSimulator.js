import { SettingsService } from '../../services/SettingsService.js';

export class CostSimulator {
  constructor(config = {}) {
    this.rendimiento = config.rendimiento || 58.5;
    this.precioVivo = config.precioVivo || 5050.0;
    this.distancia = config.distancia || 0;
    this.porcentajeIIBB = config.porcentajeIIBB || 1.7;
    this.jaulaDobleOrSimple = config.jaulaDobleOrSimple ?? true; // true = Double
    
    // Config values dynamically pull from stored settings
    const settings = SettingsService.loadSettings();

    this.pesoJaulaDoble = config.pesoJaulaDoble || settings.pesoJaulaDoble;
    this.pesoJaulaSimple = config.pesoJaulaSimple || settings.pesoJaulaSimple;
    this.margenGanancia = config.margenGanancia || settings.margenGanancia;
    this.precioKmSimple = config.precioKmSimple || settings.precioKmSimple;
    this.precioKmDouble = config.precioKmDouble || settings.precioKmDouble;
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
