// src/domain/usecases/CalculateCategoryStats.js

export class CalculateCategoryStats {
  execute(travels, categories, includeCommission = false, categoryPrices = {}) {
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

    // Real Cost Simulation
    const totalBaseCost = includeCommission ? totalOpWithComm : totalOp;
    const costoVivo = (totalBaseCost + totalFreight) / (totalKg || 1);
    const yieldVal = avgYield > 0 ? avgYield : 0.58;
    const costoGancho = yieldVal > 0 ? (costoVivo / yieldVal) : 0;
    const iibbRate = 0.017;
    const realCostGancho = costoGancho / (1 - iibbRate);

    let sellPriceRef = 0;
    let margin = 0;
    let marginPct = 0;

    if (catsToFilter.length === 1 && catsToFilter[0] !== 'TODOS') {
      const cat = catsToFilter[0];
      sellPriceRef = parseFloat(categoryPrices[cat]) || 0;
      if (sellPriceRef > 0) {
        margin = sellPriceRef - realCostGancho;
        marginPct = (margin / (realCostGancho || 1)) * 100;
      }
    }

    // Chart analytics maps
    const trendsMap = {};
    const catDistributionMap = {};
    const entityMap = {};

    completedTravels.forEach(t => {
      const date = t.date || 'Sin Fecha';
      if (!trendsMap[date]) trendsMap[date] = { totalPrice: 0, totalYield: 0, count: 0 };
      const buy = t.buy || {};
      const price = includeCommission ? (buy.avgPriceWithCommission || 0) : (buy.avgPrice || 0);
      const yVal = (buy.generalYield || 0) * 100;
      trendsMap[date].totalPrice += price;
      trendsMap[date].totalYield += yVal;
      trendsMap[date].count++;

      (buy.categories || []).forEach(cat => { 
        if (!catDistributionMap[cat]) catDistributionMap[cat] = { kg: 0, buyPriceSum: 0, count: 0 }; 
        const kgShare = (buy.totalKgClean || 0) / (buy.categories.length || 1);
        catDistributionMap[cat].kg += kgShare;
        catDistributionMap[cat].buyPriceSum += price;
        catDistributionMap[cat].count++;
      });
      
      const agentName = buy.agent?.name;
      if (agentName) {
        if (!entityMap[agentName]) entityMap[agentName] = { totalPrice: 0, totalYield: 0, yields: [], count: 0, totalKg: 0, type: 'AGENT', minYield: 999, maxYield: 0 };
        entityMap[agentName].totalPrice += price;
        entityMap[agentName].totalYield += yVal;
        entityMap[agentName].totalKg += (buy.totalKgClean || 0);
        entityMap[agentName].count++;
        entityMap[agentName].minYield = Math.min(entityMap[agentName].minYield, yVal);
        entityMap[agentName].maxYield = Math.max(entityMap[agentName].maxYield, yVal);
      }
      (buy.listOfProducers || []).forEach(p => {
        const pName = p.producer?.name;
        if (pName) {
          if (!entityMap[pName]) entityMap[pName] = { totalPrice: 0, totalYield: 0, yields: [], count: 0, totalKg: 0, type: 'PRODUCER', minYield: 999, maxYield: 0 };
          entityMap[pName].totalPrice += price;
          entityMap[pName].totalYield += yVal;
          entityMap[pName].totalKg += (p.totalKgClean || 0);
          entityMap[pName].count++;
          entityMap[pName].minYield = Math.min(entityMap[pName].minYield, yVal);
          entityMap[pName].maxYield = Math.max(entityMap[pName].maxYield, yVal);
        }
      });
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
      totalFreight,
      realCostGancho,
      sellPriceRef,
      margin,
      marginPct,
      yieldVal,
      trendsMap,
      catDistributionMap,
      entityMap
    };
  }
}
