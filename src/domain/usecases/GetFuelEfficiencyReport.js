/**
 * @file GetFuelEfficiencyReport.js
 * @description Caso de uso encargado de consolidar e iterar sobre los viajes de un camión para calcular su eficiencia de combustible histórica, distancias entre surtidores y promedios globales.
 * @module domain/usecases/GetFuelEfficiencyReport
 * @author Antigravity
 */

import { Travel } from '../entities/LogisticsModels.js';

export class GetFuelEfficiencyReport {
  /**
   * Ejecuta la agregación de datos para calcular el rendimiento de combustible.
   * @param {Array<Object>} travels - Lista de todos los viajes registrados.
   * @param {string} truckId - ID del camión a filtrar.
   * @returns {Object} Reporte procesado listo para el presentador y la UI.
   */
  execute(travels, truckId) {
    if (!truckId) {
      return { records: [], labels: [], efficiencyData: [], averageEfficiency: 0 };
    }

    // 1. Filtrar viajes completados de este camión que cuenten con datos de surtidor válidos
    const truckTravels = travels
      .map(t => t instanceof Travel ? t : new Travel(t))
      .filter(t => t.truck && String(t.truck.id) === String(truckId) && t.status !== 'DRAFT' && t.litersOnPump > 0);

    // 2. Ordenar cronológicamente por kilometraje de carga para calcular diferencias secuenciales
    truckTravels.sort((a, b) => a.kmOnPump - b.kmOnPump);

    const records = [];
    const labels = [];
    const efficiencyData = [];
    let avgSum = 0;
    let count = 0;

    for (let i = 0; i < truckTravels.length; i++) {
      const current = truckTravels[i];
      const prev = i > 0 ? truckTravels[i - 1] : null;

      let kmDiff = 0;
      let efficiency = 0;

      if (prev) {
        kmDiff = current.kmOnPump - prev.kmOnPump;
        efficiency = current.calculateFuelEfficiency(prev.kmOnPump);
      }

      const isNormal = efficiency >= 2.5 && efficiency <= 3.5;
      const isLow = efficiency > 0 && efficiency < 2.5;
      const isHigh = efficiency > 3.5;

      let status = 'NONE';
      let alertMessage = '';
      if (efficiency > 0) {
        if (isNormal) {
          status = 'NORMAL';
        } else if (isLow) {
          status = 'LOW';
          alertMessage = 'Consumo Elevado / Desvío';
        } else if (isHigh) {
          status = 'ANOMALY';
          alertMessage = 'Mal Cálculo / Falta Registro';
        }
      }

      const hasReference = prev !== null && efficiency > 0;

      // Solo graficar e incluir en promedio si está dentro del rango normal [2.5, 3.5]
      if (hasReference && isNormal) {
        labels.push(current.date);
        efficiencyData.push(efficiency.toFixed(2));
        avgSum += efficiency;
        count++;
      }

      records.push({
        date: current.date,
        description: current.description || '-',
        kmOnOrigin: current.kmOnOrigin,
        kmOnDestination: current.kmOnDestination,
        kmOnPump: current.kmOnPump,
        litersOnPump: current.litersOnPump,
        kmDiff: kmDiff > 0 ? kmDiff : 0,
        efficiency: efficiency,
        status,
        alertMessage,
        hasReference
      });
    }

    const averageEfficiency = count > 0 ? Number((avgSum / count).toFixed(2)) : 0;

    return {
      records,
      labels,
      efficiencyData,
      averageEfficiency
    };
  }
}
