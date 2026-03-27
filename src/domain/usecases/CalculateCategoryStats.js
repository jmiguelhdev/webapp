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

      let foundInCategory = false;
      buy.listOfProducers.forEach(p => {
        p.listOfProducts.forEach(pr => {
          if (pr.standardizedCategory === category) {
            const kg = pr.kgClean;
            if (kg > 0) {
              let op = pr.operation;
              if (includeCommission) {
                const commPercent = buy.agent?.percent || 0;
                op *= (1 + commPercent / 100);
              }
              totalOp += op;
              totalKg += kg;
              foundInCategory = true;
            }
          }
        });
      });

      if (foundInCategory) count++;
    });

    return {
      avgPrice: totalKg > 0 ? totalOp / totalKg : 0,
      totalKg,
      travelCount: count
    };
  }
}
