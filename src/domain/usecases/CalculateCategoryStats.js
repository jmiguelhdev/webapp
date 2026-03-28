// src/domain/usecases/CalculateCategoryStats.js

export class CalculateCategoryStats {
  execute(travels, categories, includeCommission = false) {
    let totalOp = 0;
    let totalOpWithComm = 0;
    let totalKg = 0;
    let totalFactura = 0;
    let totalQuantity = 0;
    let totalKgFaena = 0;
    let count = 0;

    const completedTravels = travels.filter(t => {
      const s = String(t.status || '').toUpperCase();
      return t.isCompleted === true && s !== 'DRAFT' && s !== 'BORRADOR';
    });
    const catsToFilter = Array.isArray(categories) ? categories : [categories];
    const isAll = catsToFilter.length === 0 || catsToFilter.includes('TODOS');

    completedTravels.forEach(t => {
      const buy = t.buy;
      if (!buy) return;

      if (isAll) {
        const kg = buy.totalKgClean;
        if (kg > 0) {
          totalOp += buy.totalOperation;
          totalOpWithComm += buy.totalOperationWithCommission;
          totalKg += kg;
          totalQuantity += buy.totalQuantity;
          totalKgFaena += buy.totalKgFaena;
          
          buy.listOfProducers.forEach(p => {
            p.listOfProducts.forEach(pr => {
              const bill = pr.taxes?.bill || { neto: 0, iva: 0 };
              totalFactura += (bill.neto || 0) + (bill.iva || 0);
            });
          });
          
          count++;
        }
      } else {
        let foundInCategory = false;
        buy.listOfProducers.forEach(p => {
          p.listOfProducts.forEach(pr => {
            if (catsToFilter.includes(pr.standardizedCategory)) {
              const kg = pr.kgClean;
              if (kg > 0) {
                const op = pr.operation;
                const commPercent = buy.agent?.percent || 0;
                const opWithComm = op * (1 + commPercent / 100);
                
                totalOp += op;
                totalOpWithComm += opWithComm;
                totalKg += kg;
                totalQuantity += (pr.quantity || 0);
                totalKgFaena += (pr.kgFaena || 0);
                
                const bill = pr.taxes?.bill || { neto: 0, iva: 0 };
                totalFactura += (bill.neto || 0) + (bill.iva || 0);
                
                foundInCategory = true;
              }
            }
          });
        });
        if (foundInCategory) count++;
      }
    });

    const facturaOverOp = totalOp > 0 ? (totalFactura / totalOp) : 0;
    const avgKgMediaRes = totalQuantity > 0 ? (totalKgFaena / totalQuantity / 2) : 0;

    return {
      avgPrice: totalKg > 0 ? totalOp / totalKg : 0,
      avgPriceWithCommission: totalKg > 0 ? totalOpWithComm / totalKg : 0,
      totalKg,
      totalQuantity,
      travelCount: count,
      facturaOverOp,
      hasFacturaWarning: facturaOverOp < 0.5 || facturaOverOp > 1.0,
      avgKgMediaRes
    };
  }
}
