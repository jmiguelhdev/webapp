// src/domain/usecases/CalculateCategoryStats.js

export class CalculateCategoryStats {
  execute(travels, categories, includeCommission = false) {
    let totalOp = 0;
    let totalOpWithComm = 0;
    let totalKg = 0;
    let totalFactura = 0;
    let totalQuantity = 0;
    let totalKgFaena = 0;
    let totalFreight = 0;
    let count = 0;
    let totalKgForYield = 0;

    const completedTravels = travels.filter(t => {
      const s = String(t.status || '').toUpperCase();
      return t.isCompleted === true && s !== 'DRAFT' && s !== 'BORRADOR';
    });
    const catsToFilter = Array.isArray(categories) ? categories : [categories];
    const isAll = catsToFilter.length === 0 || catsToFilter.includes('TODOS');

    // To track yield per entity (producer + agent combination)
    const entityYieldMap = new Map(); 

    completedTravels.forEach(t => {
      const buy = t.buy;
      if (!buy) return;

      const agentName = buy.agent?.name || 'Sin Comisionista';

      if (isAll) {
        const kg = buy.totalKgClean;
        if (kg > 0) {
          totalOp += buy.totalOperation;
          totalOpWithComm += buy.totalOperationWithCommission;
          totalKg += kg;
          totalQuantity += buy.totalQuantity;
          totalKgFaena += buy.totalKgFaena;
          totalFreight += (buy.totalFreight || 0);
          
          buy.listOfProducers.forEach(p => {
            const prodName = p.producer?.name || 'Productor';
            const entityKey = `${prodName} (ag. ${agentName})`;
            if (!entityYieldMap.has(entityKey)) {
              entityYieldMap.set(entityKey, { name: entityKey, kg: 0, kgForYield: 0, kgFaena: 0 });
            }
            const entityStats = entityYieldMap.get(entityKey);
            
            p.listOfProducts.forEach(pr => {
              const cleanKg = pr.kgClean || 0;
              const faenaKg = pr.kgFaena || 0;
              
              entityStats.kg += cleanKg;
              entityStats.kgFaena += faenaKg;
              
              if (faenaKg > 0) {
                totalKgForYield += cleanKg;
                entityStats.kgForYield += cleanKg;
              }

              const bill = pr.taxes?.bill || { neto: 0, iva: 0 };
              totalFactura += (bill.neto || 0) + (bill.iva || 0);
            });
          });
          
          count++;
        }
      } else {
        let foundInCategory = false;
        buy.listOfProducers.forEach(p => {
          const prodName = p.producer?.name || 'Productor';
          const entityKey = `${prodName} (ag. ${agentName})`;
          
          if (!entityYieldMap.has(entityKey)) {
            entityYieldMap.set(entityKey, { name: entityKey, kg: 0, kgForYield: 0, kgFaena: 0 });
          }
          const entityStats = entityYieldMap.get(entityKey);

          p.listOfProducts.forEach(pr => {
            if (catsToFilter.includes(pr.standardizedCategory)) {
              const kg = pr.kgClean;
              if (kg > 0) {
                const faenaKg = pr.kgFaena || 0;
                const op = pr.operation;
                const commPercent = buy.agent?.percent || 0;
                const opWithComm = op * (1 + commPercent / 100);
                
                totalOp += op;
                totalOpWithComm += opWithComm;
                totalKg += kg;
                totalQuantity += (pr.quantity || 0);
                totalKgFaena += faenaKg;
                
                entityStats.kg += kg;
                entityStats.kgFaena += faenaKg;

                if (faenaKg > 0) {
                  totalKgForYield += kg;
                  entityStats.kgForYield += kg;
                }

                const bill = pr.taxes?.bill || { neto: 0, iva: 0 };
                totalFactura += (bill.neto || 0) + (bill.iva || 0);
                
                foundInCategory = true;
              }
            }
          });
        });
        if (foundInCategory) {
          count++;
          // Allocate freight proportionally for selected categories in this travel
          if (buy.totalKgClean > 0 && buy.totalFreight > 0) {
            const travelKgForCats = buy.listOfProducers.reduce((sum, p) => {
              return sum + p.listOfProducts.reduce((s, pr) => {
                return s + (catsToFilter.includes(pr.standardizedCategory) ? (pr.kgClean || 0) : 0);
              }, 0);
            }, 0);
            const freightShare = (travelKgForCats / buy.totalKgClean) * buy.totalFreight;
            totalFreight += freightShare;
          }
        }
      }
    });

    const facturaOverOp = totalOp > 0 ? (totalFactura / totalOp) : 0;
    const avgKgMediaRes = totalQuantity > 0 ? (totalKgFaena / totalQuantity / 2) : 0;
    const avgYield = totalKgForYield > 0 ? (totalKgFaena / totalKgForYield) : 0;

    let maxYield = 0;
    let maxYieldEntity = '-';

    entityYieldMap.forEach(stats => {
      if (stats.kgForYield > 0) {
        const y = stats.kgFaena / stats.kgForYield;
        if (y > maxYield) {
          maxYield = y;
          maxYieldEntity = stats.name;
        }
      }
    });

    return {
      avgPrice: totalKg > 0 ? totalOp / totalKg : 0,
      avgPriceWithCommission: totalKg > 0 ? totalOpWithComm / totalKg : 0,
      totalKg,
      totalKgFaena,
      totalQuantity,
      travelCount: count,
      facturaOverOp,
      hasFacturaWarning: facturaOverOp < 0.5 || facturaOverOp > 1.0,
      avgKgMediaRes,
      avgYield,
      maxYield,
      maxYieldEntity,
      totalFreight
    };
  }
}
