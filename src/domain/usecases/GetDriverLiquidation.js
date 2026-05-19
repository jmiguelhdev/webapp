/**
 * @file GetDriverLiquidation.js
 * @description Caso de uso encargado de procesar la liquidación semanal de honorarios y reembolsos de gastos para un chofer.
 * @module domain/usecases/GetDriverLiquidation
 * @author Antigravity
 */

import { Travel } from '../entities/LogisticsModels.js';

export class GetDriverLiquidation {
  /**
   * Ejecuta el cálculo analítico de la liquidación del chofer.
   * @param {Array<Object>} travels - Todos los viajes del sistema.
   * @param {string} driverId - ID del chofer a liquidar.
   * @param {string} start - Fecha de inicio del período.
   * @param {string} end - Fecha de fin del período.
   * @returns {Object} Liquidación consolidada lista para presentación.
   */
  execute(travels, driverId, start, end) {
    if (!driverId) {
      return { travels: [], totalDriverCost: 0, totalExpenses: 0, grandTotal: 0 };
    }

    // 1. Filtrar viajes completados de este chofer dentro del rango temporal
    const filteredTravels = travels
      .map(t => t instanceof Travel ? t : new Travel(t))
      .filter(t => t.truck && t.truck.driver && String(t.truck.driver.id) === String(driverId) && t.status !== 'DRAFT' && t.date >= start && t.date <= end);

    // 2. Ordenar cronológicamente
    filteredTravels.sort((a, b) => new Date(a.date) - new Date(b.date));

    let totalDriverCost = 0;
    let totalExpenses = 0;

    const items = filteredTravels.map(t => {
      const travelCost = t.driverCost || 0;
      totalDriverCost += travelCost;

      const reimbursableExpenses = (t.expenses || []).filter(e => e.isReimbursable);
      const expTotal = reimbursableExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      totalExpenses += expTotal;

      return {
        id: t.id,
        date: t.date,
        description: t.description || '-',
        trailerType: t.truck?.trailer?.type || '-',
        distanceKm: t.distanceKm,
        travelCost,
        reimbursableExpenses: reimbursableExpenses.map(e => ({ description: e.description, amount: e.amount })),
        expTotal
      };
    });

    return {
      travels: items,
      totalDriverCost,
      totalExpenses,
      grandTotal: totalDriverCost + totalExpenses
    };
  }
}
