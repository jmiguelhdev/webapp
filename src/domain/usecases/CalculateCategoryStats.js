// src/domain/usecases/CalculateCategoryStats.js

/**
 * Caso de uso para calcular métricas y estadísticas comerciales de hacienda por categoría.
 * Procesa la liquidación ponderada de fletes, rindes máximos por productor/comisionista y simulaciones de costos reales.
 */
export class CalculateCategoryStats {
  /**
   * Ejecuta la agregación de estadísticas de compras de hacienda.
   * @param {Array<Object>} travels - Lista de todos los viajes.
   * @param {Array<string>|string} categories - Categorías seleccionadas a filtrar ('TODOS' o lista de nombres).
   * @param {boolean} [includeCommission=false] - Si se debe sumar la comisión del comisionista al costo base.
   * @param {Object} [categoryPrices={}] - Mapeo de precios sugeridos de venta por categoría.
   * @returns {Object} Resumen analítico calculado.
   */
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
      const isComp = t.isCompleted === true || s === 'COMPLETED' || s === 'FINALIZADO' || s === 'ACTIVE' || s === 'ACTIVO';
      return isComp && s !== 'DRAFT' && s !== 'BORRADOR';
    });
    const catsToFilter = Array.isArray(categories) ? categories : [categories];
    const isAll = catsToFilter.length === 0 || catsToFilter.includes('TODOS');

    // To track yield per entity (producer + agent combination)
    const entityYieldMap = new Map(); 
    // To track category breakdown with heads, yield, clean kg, faena kg, prices and real costs
    const catBreakdownMap = new Map();

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
              entityYieldMap.set(entityKey, { name: entityKey, kg: 0, kgForYield: 0, kgFaena: 0, maxTravelYield: 0, travelId: null });
            }
            const entityStats = entityYieldMap.get(entityKey);
            
            let pClean = 0;
            let pFaena = 0;
            p.listOfProducts.forEach(pr => {
              const cleanKg = pr.kgClean || 0;
              const faenaKg = pr.kgFaena || 0;
              const qty = pr.quantity || 0;
              const op = pr.operation || 0;
              const commPercent = buy.agent?.percent || 0;
              const opWithComm = op * (1 + commPercent / 100);
              const catName = pr.standardizedCategory || pr.name || 'OTRO';
              
              entityStats.kg += cleanKg;
              entityStats.kgFaena += faenaKg;
              
              if (faenaKg > 0) {
                totalKgForYield += cleanKg;
                entityStats.kgForYield += cleanKg;
                pClean += cleanKg;
                pFaena += faenaKg;
              }

              const bill = pr.taxes?.bill || { neto: 0, iva: 0 };
              totalFactura += (bill.neto || 0) + (bill.iva || 0);

              // Category breakdown accumulation
              if (!catBreakdownMap.has(catName)) {
                catBreakdownMap.set(catName, {
                  category: catName,
                  heads: 0,
                  kgClean: 0,
                  kgFaena: 0,
                  totalOp: 0,
                  totalOpWithComm: 0,
                  count: 0
                });
              }
              const catEntry = catBreakdownMap.get(catName);
              catEntry.heads += qty;
              catEntry.kgClean += cleanKg;
              catEntry.kgFaena += faenaKg;
              catEntry.totalOp += op;
              catEntry.totalOpWithComm += opWithComm;
              catEntry.count++;
            });

            if (pClean > 0 && pFaena > 0) {
              const travelYield = pFaena / pClean;
              if (travelYield > entityStats.maxTravelYield) {
                entityStats.maxTravelYield = travelYield;
                entityStats.travelId = t.id;
              }
            }
          });
          
          count++;
        }
      } else {
        let foundInCategory = false;
        buy.listOfProducers.forEach(p => {
          const prodName = p.producer?.name || 'Productor';
          const entityKey = `${prodName} (ag. ${agentName})`;
          
          if (!entityYieldMap.has(entityKey)) {
            entityYieldMap.set(entityKey, { name: entityKey, kg: 0, kgForYield: 0, kgFaena: 0, maxTravelYield: 0, travelId: null });
          }
          const entityStats = entityYieldMap.get(entityKey);

          let pClean = 0;
          let pFaena = 0;
          p.listOfProducts.forEach(pr => {
            const catName = pr.standardizedCategory || pr.name || 'OTRO';
            if (catsToFilter.includes(catName)) {
              const kg = pr.kgClean;
              if (kg > 0) {
                const faenaKg = pr.kgFaena || 0;
                const qty = pr.quantity || 0;
                const op = pr.operation;
                const commPercent = buy.agent?.percent || 0;
                const opWithComm = op * (1 + commPercent / 100);
                
                totalOp += op;
                totalOpWithComm += opWithComm;
                totalKg += kg;
                totalQuantity += qty;
                totalKgFaena += faenaKg;
                
                entityStats.kg += kg;
                entityStats.kgFaena += faenaKg;

                if (faenaKg > 0) {
                  totalKgForYield += kg;
                  entityStats.kgForYield += kg;
                  pClean += kg;
                  pFaena += faenaKg;
                }

                const bill = pr.taxes?.bill || { neto: 0, iva: 0 };
                totalFactura += (bill.neto || 0) + (bill.iva || 0);
                
                // Category breakdown accumulation
                if (!catBreakdownMap.has(catName)) {
                  catBreakdownMap.set(catName, {
                    category: catName,
                    heads: 0,
                    kgClean: 0,
                    kgFaena: 0,
                    totalOp: 0,
                    totalOpWithComm: 0,
                    count: 0
                  });
                }
                const catEntry = catBreakdownMap.get(catName);
                catEntry.heads += qty;
                catEntry.kgClean += kg;
                catEntry.kgFaena += faenaKg;
                catEntry.totalOp += op;
                catEntry.totalOpWithComm += opWithComm;
                catEntry.count++;

                foundInCategory = true;
              }
            }
          });
          
          if (pClean > 0 && pFaena > 0) {
            const travelYield = pFaena / pClean;
            if (travelYield > entityStats.maxTravelYield) {
              entityStats.maxTravelYield = travelYield;
              entityStats.travelId = t.id;
            }
          }
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
    let maxYieldTravelId = null;
 
    entityYieldMap.forEach(stats => {
      if (stats.kgForYield > 0) {
        const y = stats.kgFaena / stats.kgForYield;
        if (y > maxYield) {
          maxYield = y;
          maxYieldEntity = stats.name;
          maxYieldTravelId = stats.travelId;
        }
      }
    });

    // Real Cost Simulation
    const totalBaseCost = includeCommission ? totalOpWithComm : totalOp;
    const costoVivo = (totalBaseCost + totalFreight) / (totalKg || 1);
    const yieldVal = avgYield > 0 ? avgYield : 0;
    const costoGancho = yieldVal > 0 ? (costoVivo / yieldVal) : 0;
    const iibbRate = 0.017;
    const realCostGancho = costoGancho > 0 ? (costoGancho / (1 - iibbRate)) : 0;

    let sellPriceRef = 0;
    let margin = 0;
    let marginPct = 0;

    if (catsToFilter.length === 1 && catsToFilter[0] !== 'TODOS') {
      const cat = catsToFilter[0];
      sellPriceRef = parseFloat(categoryPrices[cat]) || 0;
      if (sellPriceRef > 0 && realCostGancho > 0) {
        margin = sellPriceRef - realCostGancho;
        marginPct = (margin / realCostGancho) * 100;
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

    // Convert catBreakdownMap into structured sorted array
    const categoryBreakdown = Array.from(catBreakdownMap.values()).map(entry => {
      const yieldPct = entry.kgClean > 0 ? (entry.kgFaena / entry.kgClean) * 100 : 0;
      const avgPrice = entry.kgClean > 0 ? (entry.totalOp / entry.kgClean) : 0;
      const avgPriceWithComm = entry.kgClean > 0 ? (entry.totalOpWithComm / entry.kgClean) : 0;
      const baseCostVivo = includeCommission ? avgPriceWithComm : avgPrice;
      const yieldRatio = yieldPct > 0 ? (yieldPct / 100) : 0;
      const costoGancho = yieldRatio > 0 ? (baseCostVivo / yieldRatio) : 0;
      const iibbRate = 0.017;
      const realCostGancho = costoGancho > 0 ? (costoGancho / (1 - iibbRate)) : 0;
      const sellPriceRef = parseFloat(categoryPrices[entry.category]) || 0;
      const margin = (sellPriceRef > 0 && realCostGancho > 0) ? (sellPriceRef - realCostGancho) : 0;
      const marginPct = (sellPriceRef > 0 && realCostGancho > 0) ? (margin / realCostGancho) * 100 : 0;

      return {
        category: entry.category,
        heads: entry.heads,
        kgClean: entry.kgClean,
        kgFaena: entry.kgFaena,
        yieldPct,
        avgPrice,
        avgPriceWithCommission: avgPriceWithComm,
        baseCostVivo,
        costoGancho,
        realCostGancho,
        sellPriceRef,
        margin,
        marginPct
      };
    }).sort((a, b) => b.kgClean - a.kgClean);

    // Aggregation for Comisionistas and Productores comparisons
    const agentCompMap = new Map();
    const prodCompMap = new Map();
    const crossCompMap = new Map();

    completedTravels.forEach(t => {
      const buy = t.buy;
      if (!buy) return;

      const agentName = (buy.agent?.name || 'Sin Comisionista').trim();
      const agentPercent = buy.agent?.percent || 0;

      if (!agentCompMap.has(agentName)) {
        agentCompMap.set(agentName, {
          name: agentName,
          percent: agentPercent,
          travelCount: 0,
          heads: 0,
          kgClean: 0,
          kgFaena: 0,
          totalOp: 0,
          totalOpWithComm: 0,
          totalCommission: 0,
          weightedSellRef: 0,
          refKg: 0,
          producersMap: new Map()
        });
      }
      const aComp = agentCompMap.get(agentName);
      aComp.travelCount++;

      (buy.listOfProducers || []).forEach(p => {
        const prodName = (p.producer?.name || p.name || 'Productor').trim();
        const prodCuit = String(p.producer?.cuit || p.cuit || '').trim();
        const prodOrigin = p.origin || '';

        if (!prodCompMap.has(prodName)) {
          prodCompMap.set(prodName, {
            name: prodName,
            cuit: prodCuit,
            origin: prodOrigin,
            travelCount: 0,
            heads: 0,
            kgClean: 0,
            kgFaena: 0,
            totalOp: 0,
            totalOpWithComm: 0,
            weightedSellRef: 0,
            refKg: 0,
            agentsMap: new Map()
          });
        }
        const pComp = prodCompMap.get(prodName);
        pComp.travelCount++;

        // Sub-producer within agent
        if (!aComp.producersMap.has(prodName)) {
          aComp.producersMap.set(prodName, {
            name: prodName,
            cuit: prodCuit,
            origin: prodOrigin,
            travelCount: 0,
            heads: 0,
            kgClean: 0,
            kgFaena: 0,
            totalOp: 0,
            totalOpWithComm: 0,
            weightedSellRef: 0,
            refKg: 0
          });
        }
        const aSubProd = aComp.producersMap.get(prodName);
        aSubProd.travelCount++;

        // Sub-agent within producer
        if (!pComp.agentsMap.has(agentName)) {
          pComp.agentsMap.set(agentName, {
            name: agentName,
            percent: agentPercent,
            travelCount: 0,
            heads: 0,
            kgClean: 0,
            kgFaena: 0,
            totalOp: 0,
            totalOpWithComm: 0,
            weightedSellRef: 0,
            refKg: 0
          });
        }
        const pSubAgent = pComp.agentsMap.get(agentName);
        pSubAgent.travelCount++;

        // Cross Cell (agent x producer)
        const crossKey = `${agentName}:::${prodName}`;
        if (!crossCompMap.has(crossKey)) {
          crossCompMap.set(crossKey, {
            agentName,
            producerName: prodName,
            cuit: prodCuit,
            travelCount: 0,
            heads: 0,
            kgClean: 0,
            kgFaena: 0,
            totalOp: 0,
            totalOpWithComm: 0,
            weightedSellRef: 0,
            refKg: 0
          });
        }
        const crossEntry = crossCompMap.get(crossKey);
        crossEntry.travelCount++;

        p.listOfProducts.forEach(pr => {
          const catName = pr.standardizedCategory || pr.name || 'OTRO';
          if (isAll || catsToFilter.includes(catName)) {
            const cleanKg = pr.kgClean || 0;
            const faenaKg = pr.kgFaena || 0;
            const qty = pr.quantity || 0;
            const op = pr.operation || 0;
            const opWithComm = op * (1 + agentPercent / 100);
            const commAmount = opWithComm - op;
            const refPrice = parseFloat(categoryPrices[catName]) || 0;

            // Update Agent Aggregate
            aComp.heads += qty;
            aComp.kgClean += cleanKg;
            aComp.kgFaena += faenaKg;
            aComp.totalOp += op;
            aComp.totalOpWithComm += opWithComm;
            aComp.totalCommission += commAmount;
            if (refPrice > 0 && cleanKg > 0) {
              aComp.weightedSellRef += refPrice * cleanKg;
              aComp.refKg += cleanKg;
            }

            // Update Producer Aggregate
            pComp.heads += qty;
            pComp.kgClean += cleanKg;
            pComp.kgFaena += faenaKg;
            pComp.totalOp += op;
            pComp.totalOpWithComm += opWithComm;
            if (refPrice > 0 && cleanKg > 0) {
              pComp.weightedSellRef += refPrice * cleanKg;
              pComp.refKg += cleanKg;
            }

            // Update Agent's Sub-producer
            aSubProd.heads += qty;
            aSubProd.kgClean += cleanKg;
            aSubProd.kgFaena += faenaKg;
            aSubProd.totalOp += op;
            aSubProd.totalOpWithComm += opWithComm;
            if (refPrice > 0 && cleanKg > 0) {
              aSubProd.weightedSellRef += refPrice * cleanKg;
              aSubProd.refKg += cleanKg;
            }

            // Update Producer's Sub-agent
            pSubAgent.heads += qty;
            pSubAgent.kgClean += cleanKg;
            pSubAgent.kgFaena += faenaKg;
            pSubAgent.totalOp += op;
            pSubAgent.totalOpWithComm += opWithComm;
            if (refPrice > 0 && cleanKg > 0) {
              pSubAgent.weightedSellRef += refPrice * cleanKg;
              pSubAgent.refKg += cleanKg;
            }

            // Update Cross Entry
            crossEntry.heads += qty;
            crossEntry.kgClean += cleanKg;
            crossEntry.kgFaena += faenaKg;
            crossEntry.totalOp += op;
            crossEntry.totalOpWithComm += opWithComm;
            if (refPrice > 0 && cleanKg > 0) {
              crossEntry.weightedSellRef += refPrice * cleanKg;
              crossEntry.refKg += cleanKg;
            }
          }
        });
      });
    });

    // Transform maps to structured sorted arrays
    const agentComparisons = Array.from(agentCompMap.values()).map(a => {
      const yieldPct = a.kgClean > 0 ? (a.kgFaena / a.kgClean) * 100 : 0;
      const avgPrice = a.kgClean > 0 ? (a.totalOp / a.kgClean) : 0;
      const avgPriceWithComm = a.kgClean > 0 ? (a.totalOpWithComm / a.kgClean) : 0;
      const costVivo = includeCommission ? avgPriceWithComm : avgPrice;
      const yieldRatio = yieldPct > 0 ? (yieldPct / 100) : 0;
      const costoGancho = yieldRatio > 0 ? (costVivo / yieldRatio) : 0;
      const realCostGancho = costoGancho > 0 ? (costoGancho / (1 - 0.017)) : 0;
      const sellPriceRef = a.refKg > 0 && a.weightedSellRef > 0 ? (a.weightedSellRef / a.refKg) : 0;
      const margin = (sellPriceRef > 0 && realCostGancho > 0) ? (sellPriceRef - realCostGancho) : 0;
      const marginPct = (sellPriceRef > 0 && realCostGancho > 0) ? (margin / realCostGancho) * 100 : 0;

      const producers = Array.from(a.producersMap.values()).map(p => {
        const pYield = p.kgClean > 0 ? (p.kgFaena / p.kgClean) * 100 : 0;
        const pPrice = p.kgClean > 0 ? (p.totalOp / p.kgClean) : 0;
        const pPriceWithComm = p.kgClean > 0 ? (p.totalOpWithComm / p.kgClean) : 0;
        const pCostVivo = includeCommission ? pPriceWithComm : pPrice;
        const pYieldRatio = pYield > 0 ? (pYield / 100) : 0;
        const pCostoGancho = pYieldRatio > 0 ? (pCostVivo / pYieldRatio) : 0;
        const pRealCost = pCostoGancho > 0 ? (pCostoGancho / (1 - 0.017)) : 0;
        const pSellRef = p.refKg > 0 && p.weightedSellRef > 0 ? (p.weightedSellRef / p.refKg) : 0;
        const pMargin = (pSellRef > 0 && pRealCost > 0) ? (pSellRef - pRealCost) : 0;
        const pMarginPct = (pSellRef > 0 && pRealCost > 0) ? (pMargin / pRealCost) * 100 : 0;
        return {
          ...p,
          yieldPct: pYield,
          avgPrice: pPrice,
          avgPriceWithCommission: pPriceWithComm,
          costoGancho: pCostoGancho,
          realCostGancho: pRealCost,
          sellPriceRef: pSellRef,
          margin: pMargin,
          marginPct: pMarginPct
        };
      }).sort((x, y) => y.kgClean - x.kgClean);

      return {
        name: a.name,
        percent: a.percent,
        travelCount: a.travelCount,
        heads: a.heads,
        kgClean: a.kgClean,
        kgFaena: a.kgFaena,
        yieldPct,
        avgPrice,
        avgPriceWithCommission: avgPriceWithComm,
        costoGancho,
        realCostGancho,
        sellPriceRef,
        margin,
        marginPct,
        totalOp: a.totalOp,
        totalOpWithCommission: a.totalOpWithComm,
        totalCommission: a.totalCommission,
        producers
      };
    }).sort((a, b) => b.kgClean - a.kgClean);

    const producerComparisons = Array.from(prodCompMap.values()).map(p => {
      const yieldPct = p.kgClean > 0 ? (p.kgFaena / p.kgClean) * 100 : 0;
      const avgPrice = p.kgClean > 0 ? (p.totalOp / p.kgClean) : 0;
      const avgPriceWithComm = p.kgClean > 0 ? (p.totalOpWithComm / p.kgClean) : 0;
      const costVivo = includeCommission ? avgPriceWithComm : avgPrice;
      const yieldRatio = yieldPct > 0 ? (yieldPct / 100) : 0;
      const costoGancho = yieldRatio > 0 ? (costVivo / yieldRatio) : 0;
      const realCostGancho = costoGancho > 0 ? (costoGancho / (1 - 0.017)) : 0;
      const sellPriceRef = p.refKg > 0 && p.weightedSellRef > 0 ? (p.weightedSellRef / p.refKg) : 0;
      const margin = (sellPriceRef > 0 && realCostGancho > 0) ? (sellPriceRef - realCostGancho) : 0;
      const marginPct = (sellPriceRef > 0 && realCostGancho > 0) ? (margin / realCostGancho) * 100 : 0;

      const agents = Array.from(p.agentsMap.values()).map(a => {
        const aYield = a.kgClean > 0 ? (a.kgFaena / a.kgClean) * 100 : 0;
        const aPrice = a.kgClean > 0 ? (a.totalOp / a.kgClean) : 0;
        const aPriceWithComm = a.kgClean > 0 ? (a.totalOpWithComm / a.kgClean) : 0;
        const aCostVivo = includeCommission ? aPriceWithComm : aPrice;
        const aYieldRatio = aYield > 0 ? (aYield / 100) : 0;
        const aCostoGancho = aYieldRatio > 0 ? (aCostVivo / aYieldRatio) : 0;
        const aRealCost = aCostoGancho > 0 ? (aCostoGancho / (1 - 0.017)) : 0;
        const aSellRef = a.refKg > 0 && a.weightedSellRef > 0 ? (a.weightedSellRef / a.refKg) : 0;
        const aMargin = (aSellRef > 0 && aRealCost > 0) ? (aSellRef - aRealCost) : 0;
        const aMarginPct = (aSellRef > 0 && aRealCost > 0) ? (aMargin / aRealCost) * 100 : 0;
        return {
          ...a,
          yieldPct: aYield,
          avgPrice: aPrice,
          avgPriceWithCommission: aPriceWithComm,
          costoGancho: aCostoGancho,
          realCostGancho: aRealCost,
          sellPriceRef: aSellRef,
          margin: aMargin,
          marginPct: aMarginPct
        };
      }).sort((x, y) => y.kgClean - x.kgClean);

      return {
        name: p.name,
        cuit: p.cuit,
        origin: p.origin,
        travelCount: p.travelCount,
        heads: p.heads,
        kgClean: p.kgClean,
        kgFaena: p.kgFaena,
        yieldPct,
        avgPrice,
        avgPriceWithCommission: avgPriceWithComm,
        costoGancho,
        realCostGancho,
        sellPriceRef,
        margin,
        marginPct,
        totalOp: p.totalOp,
        totalOpWithCommission: p.totalOpWithComm,
        agents
      };
    }).sort((a, b) => b.kgClean - a.kgClean);

    const crossMatrix = {
      agents: agentComparisons.map(a => a.name),
      producers: producerComparisons.map(p => p.name),
      cells: {}
    };
    crossCompMap.forEach((entry, key) => {
      const yPct = entry.kgClean > 0 ? (entry.kgFaena / entry.kgClean) * 100 : 0;
      const price = entry.kgClean > 0 ? (entry.totalOp / entry.kgClean) : 0;
      const priceWithComm = entry.kgClean > 0 ? (entry.totalOpWithComm / entry.kgClean) : 0;
      const costVivo = includeCommission ? priceWithComm : price;
      const yieldRatio = yPct > 0 ? (yPct / 100) : 0;
      const costoGancho = yieldRatio > 0 ? (costVivo / yieldRatio) : 0;
      const realCost = costoGancho > 0 ? (costoGancho / (1 - 0.017)) : 0;
      const sellPriceRef = entry.refKg > 0 && entry.weightedSellRef > 0 ? (entry.weightedSellRef / entry.refKg) : 0;
      const margin = (sellPriceRef > 0 && realCost > 0) ? (sellPriceRef - realCost) : 0;
      const marginPct = (sellPriceRef > 0 && realCost > 0) ? (margin / realCost) * 100 : 0;

      crossMatrix.cells[key] = {
        ...entry,
        yieldPct: yPct,
        avgPrice: price,
        avgPriceWithCommission: priceWithComm,
        costoGancho,
        realCostGancho: realCost,
        sellPriceRef,
        margin,
        marginPct
      };
    });

    const comparisons = {
      agents: agentComparisons,
      producers: producerComparisons,
      crossMatrix
    };

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
      maxYieldTravelId,
      totalFreight,
      realCostGancho,
      sellPriceRef,
      margin,
      marginPct,
      yieldVal,
      trendsMap,
      catDistributionMap,
      entityMap,
      categoryBreakdown,
      comparisons
    };
  }
}
