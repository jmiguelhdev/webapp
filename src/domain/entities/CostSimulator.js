/**
 * Entidad de dominio para la simulación de costos logísticos y operativos.
 * No contiene dependencias externas.
 */
export class CostSimulator {
  /**
   * @param {Object} config Configuración de parámetros de la simulación.
   * @param {number} [config.rendimiento=58.5] Porcentaje de rendimiento en faena.
   * @param {number} [config.precioVivo=5050.0] Precio por kg vivo.
   * @param {number} [config.distancia=0] Distancia del viaje en km.
   * @param {number} [config.porcentajeIIBB=1.7] Porcentaje de Ingresos Brutos.
   * @param {boolean} [config.jaulaDobleOrSimple=true] true = Doble, false = Simple.
   * @param {number} [config.pesoJaulaDoble] Peso estimado para jaula doble.
   * @param {number} [config.pesoJaulaSimple] Peso estimado para jaula simple.
   * @param {number} [config.margenGanancia] Multiplicador del margen de ganancia (ej. 1.25 para 25%).
   * @param {number} [config.precioKmSimple] Precio del flete por km para jaula simple.
   * @param {number} [config.precioKmDouble] Precio del flete por km para jaula doble.
   */
  constructor(config = {}) {
    this.rendimiento = config.rendimiento || 58.5;
    this.precioVivo = config.precioVivo || 5050.0;
    this.distancia = config.distancia || 0;
    this.porcentajeIIBB = config.porcentajeIIBB || 1.7;
    this.jaulaDobleOrSimple = config.jaulaDobleOrSimple ?? true; // true = Double
    
    // Estos valores deben ser inyectados por el caso de uso/controlador
    this.pesoJaulaDoble = config.pesoJaulaDoble || 0;
    this.pesoJaulaSimple = config.pesoJaulaSimple || 0;
    this.margenGanancia = config.margenGanancia || 1.0;
    this.precioKmSimple = config.precioKmSimple || 0;
    this.precioKmDouble = config.precioKmDouble || 0;
  }

  /** @returns {number} Precio por kilómetro según el tipo de jaula. */
  get precioKm() { return this.jaulaDobleOrSimple ? this.precioKmDouble : this.precioKmSimple; }
  
  /** @returns {number} Kilos vivos estimados según el tipo de jaula. */
  get kgVivos() { return this.jaulaDobleOrSimple ? this.pesoJaulaDoble : this.pesoJaulaSimple; }
  
  /** @returns {number} Kilos de faena estimados basados en el rendimiento. */
  get kgFaena() { return this.kgVivos * (this.rendimiento / 100.0); }
  
  /** @returns {number} Costo inicial por kilo de carne (vivo / rendimiento). */
  get costoInicialPorKgCarne() { return this.rendimiento > 0 ? this.precioVivo / (this.rendimiento / 100.0) : 0; }
  
  /** @returns {number} Costo de flete distribuido por kilo de carne. */
  get costoFletePorKgCarne() { return this.kgFaena > 0 ? (this.distancia * this.precioKm) / this.kgFaena : 0; }
  
  /** @returns {number} Costo final por kilo incluyendo impuestos. */
  get costoFinal() {
    const baseBruta = this.costoInicialPorKgCarne + this.costoFletePorKgCarne;
    const tasaImpuestos = this.margenGanancia * (this.porcentajeIIBB / 100.0);
    const divisor = 1.0 - tasaImpuestos;
    return divisor > 0.0001 ? baseBruta / divisor : baseBruta;
  }
  
  /** @returns {number} Precio de venta facturado por kilo. */
  get facturaVentaPorKgCarne() { return this.costoFinal * this.margenGanancia; }
  
  /** @returns {number} Monto correspondiente a Ingresos Brutos. */
  get costoIIBB() { return this.facturaVentaPorKgCarne * (this.porcentajeIIBB / 100.0); }
  
  /** @returns {number} Utilidad neta por kilo de carne. */
  get utilidadPorKg() { return this.facturaVentaPorKgCarne - this.costoFinal; }
  
  /** @returns {number} Total estimado de la venta completa de la jaula. */
  get totalVentaEstimada() { return this.facturaVentaPorKgCarne * this.kgFaena; }
  
  /** @returns {number} Utilidad total estimada por la venta de la jaula. */
  get utilidadTotalEstimada() { return this.utilidadPorKg * this.kgFaena; }
}
