/**
 * Clase que modela las simulaciones de costo gancho para hacienda.
 * Contiene lógica matemática pura libre de dependencias de infraestructura.
 */
export class CostSimulator {
  /**
   * @param {Object} [config={}] - Parámetros de la simulación.
   * @param {number} [config.rendimiento=58.5] - Porcentaje de rendimiento estimado.
   * @param {number} [config.precioVivo=5050.0] - Precio en pie por kilo vivo.
   * @param {number} [config.distancia=0] - Distancia en kilómetros al establecimiento.
   * @param {number} [config.porcentajeIIBB=1.7] - Alícuota del impuesto IIBB en porcentaje.
   * @param {boolean} [config.jaulaDobleOrSimple=true] - Modo de carga (true = jaula doble, false = simple).
   * @param {Object} [config.settings] - Configuración cargada de la aplicación.
   */
  constructor(config = {}) {
    this.rendimiento = config.rendimiento || 58.5;
    this.precioVivo = config.precioVivo || 5050.0;
    this.distancia = config.distancia || 0;
    this.porcentajeIIBB = config.porcentajeIIBB || 1.7;
    this.jaulaDobleOrSimple = config.jaulaDobleOrSimple ?? true; // true = Double
    
    // Config values fallback to settings passed via constructor config
    const settings = config.settings || {};

    this.pesoJaulaDoble = config.pesoJaulaDoble || settings.pesoJaulaDoble || 32000;
    this.pesoJaulaSimple = config.pesoJaulaSimple || settings.pesoJaulaSimple || 16000;
    this.margenGanancia = config.margenGanancia || settings.margenGanancia || 1.05;
    this.precioKmSimple = config.precioKmSimple || settings.precioKmSimple || 1200;
    this.precioKmDouble = config.precioKmDouble || settings.precioKmDouble || 2000;
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
