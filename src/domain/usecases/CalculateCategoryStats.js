// src/domain/usecases/CalculateCategoryStats.js

export class CalculateCategoryStats {
  /**
   * @param {Array} travels 
   * @param {Array|string} categories - One or more categories to aggregate
   * @param {boolean} includeCommission 
   */
  execute(travels, categories, includeCommission = false) {
    let totalOp = 0;
    let totalKg = 0;
    let count = 0;

    const completedTravels = travels.filter(t => t.isCompleted);
    
    // Normalize categories to an array (excluding 'TODOS')
    const catsToFilter = Array.isArray(categories) ? categories : [categories];
    const isAll = catsToFilter.length === 0 || catsToFilter.includes('TODOS');

    completedTravels.forEach(t => {
      const buy = t.buy;
      if (!buy) return;

      if (isAll) {
        // Global stats: sum all products in the buy
        const kg = buy.totalKgClean;
        if (kg > 0) {
          totalOp += includeCommission ? buy.totalOperationWithCommission : buy.totalOperation;
          totalKg += kg;
          count++;
        }
      } else {
        // Multi-category specific stats: sum products that match ANY of the selected categories
        let foundInCategory = false;
        buy.listOfProducers.forEach(p => {
          p.listOfProducts.forEach(pr => {
            if (catsToFilter.includes(pr.standardizedCategory)) {
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
      }
    });

    return {
      avgPrice: totalKg > 0 ? totalOp / totalKg : 0,
      totalKg,
      travelCount: count
    };
  }
}
