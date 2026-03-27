// src/domain/usecases/CalculateCategoryStats.js

export class CalculateCategoryStats {
  execute(travels, category, includeCommission = false) {
    let totalOp = 0;
    let totalKg = 0;
    let count = 0;

    const completedTravels = travels.filter(t => t.isCompleted);

    completedTravels.forEach(t => {
      const buy = t.buy;
      if (!buy) return;

      // As per user request: Use buy entity's category
      if (buy.category === category) {
        const kg = buy.totalKgClean;
        if (kg > 0) {
          totalOp += includeCommission ? buy.totalOperationWithCommission : buy.totalOperation;
          totalKg += kg;
          count++;
        }
      }
    });

    return {
      avgPrice: totalKg > 0 ? totalOp / totalKg : 0,
      totalKg,
      travelCount: count
    };
  }
}
