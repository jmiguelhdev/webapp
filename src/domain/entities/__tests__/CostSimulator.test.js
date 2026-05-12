import { describe, it, expect } from 'vitest';
import { CostSimulator } from '../CostSimulator.js';

describe('CostSimulator', () => {
  it('should initialize with default values', () => {
    const simulator = new CostSimulator();
    expect(simulator.rendimiento).toBe(58.5);
    expect(simulator.precioVivo).toBe(5050.0);
    expect(simulator.distancia).toBe(0);
    expect(simulator.porcentajeIIBB).toBe(1.7);
    expect(simulator.jaulaDobleOrSimple).toBe(true);
    expect(simulator.pesoJaulaDoble).toBe(0);
    expect(simulator.pesoJaulaSimple).toBe(0);
    expect(simulator.margenGanancia).toBe(1.0);
    expect(simulator.precioKmSimple).toBe(0);
    expect(simulator.precioKmDouble).toBe(0);
  });

  it('should calculate precioKm correctly based on jaula type', () => {
    const config = { precioKmSimple: 1000, precioKmDouble: 1500 };
    
    const simDoble = new CostSimulator({ ...config, jaulaDobleOrSimple: true });
    expect(simDoble.precioKm).toBe(1500);

    const simSimple = new CostSimulator({ ...config, jaulaDobleOrSimple: false });
    expect(simSimple.precioKm).toBe(1000);
  });

  it('should calculate kgVivos correctly based on jaula type', () => {
    const config = { pesoJaulaSimple: 10000, pesoJaulaDoble: 20000 };
    
    const simDoble = new CostSimulator({ ...config, jaulaDobleOrSimple: true });
    expect(simDoble.kgVivos).toBe(20000);

    const simSimple = new CostSimulator({ ...config, jaulaDobleOrSimple: false });
    expect(simSimple.kgVivos).toBe(10000);
  });

  it('should calculate kgFaena correctly', () => {
    const config = { pesoJaulaDoble: 20000, rendimiento: 60 };
    const simulator = new CostSimulator(config);
    // 20000 * 0.6 = 12000
    expect(simulator.kgFaena).toBe(12000);
  });

  it('should calculate costoInicialPorKgCarne correctly', () => {
    const config = { precioVivo: 6000, rendimiento: 60 };
    const simulator = new CostSimulator(config);
    // 6000 / 0.6 = 10000
    expect(simulator.costoInicialPorKgCarne).toBe(10000);
  });

  it('should calculate costoInicialPorKgCarne as 0 if rendimiento is 0', () => {
    const config = { precioVivo: 6000, rendimiento: 0 };
    const simulator = new CostSimulator(config);
    expect(simulator.costoInicialPorKgCarne).toBe(0);
  });

  it('should calculate costoFletePorKgCarne correctly', () => {
    const config = { 
      pesoJaulaDoble: 20000, 
      rendimiento: 50, // kgFaena = 10000
      distancia: 500, 
      precioKmDouble: 2000 
    };
    const simulator = new CostSimulator(config);
    // flete = 500 * 2000 = 1000000
    // por kg = 1000000 / 10000 = 100
    expect(simulator.costoFletePorKgCarne).toBe(100);
  });

  it('should calculate costoFletePorKgCarne as 0 if kgFaena is 0', () => {
    const simulator = new CostSimulator({ pesoJaulaDoble: 0 });
    expect(simulator.costoFletePorKgCarne).toBe(0);
  });

  it('should calculate costoFinal and related correctly', () => {
    const config = {
      precioVivo: 5000,
      rendimiento: 50, // costo inicial = 10000
      pesoJaulaDoble: 20000, // kgFaena = 10000
      distancia: 500,
      precioKmDouble: 2000, // costo flete = 100
      margenGanancia: 1.2,
      porcentajeIIBB: 2 // 2%
    };
    // baseBruta = 10100
    // tasaImpuestos = 1.2 * 0.02 = 0.024
    // divisor = 1 - 0.024 = 0.976
    // costoFinal = 10100 / 0.976 = 10348.36
    const simulator = new CostSimulator(config);
    
    expect(simulator.costoFinal).toBeCloseTo(10100 / 0.976);
    expect(simulator.facturaVentaPorKgCarne).toBeCloseTo((10100 / 0.976) * 1.2);
    expect(simulator.costoIIBB).toBeCloseTo(((10100 / 0.976) * 1.2) * 0.02);
    expect(simulator.utilidadPorKg).toBeCloseTo(((10100 / 0.976) * 1.2) - (10100 / 0.976));
    expect(simulator.totalVentaEstimada).toBeCloseTo(((10100 / 0.976) * 1.2) * 10000);
    expect(simulator.utilidadTotalEstimada).toBeCloseTo((((10100 / 0.976) * 1.2) - (10100 / 0.976)) * 10000);
  });

  it('should handle divisor <= 0.0001 gracefully in costoFinal', () => {
    const config = {
      precioVivo: 5000,
      rendimiento: 50, 
      margenGanancia: 50,
      porcentajeIIBB: 2 // 50 * 0.02 = 1.0 (divisor = 0)
    };
    const simulator = new CostSimulator(config);
    // baseBruta = 10000
    // Because divisor is 0, it should return baseBruta
    expect(simulator.costoFinal).toBe(10000);
  });
});
