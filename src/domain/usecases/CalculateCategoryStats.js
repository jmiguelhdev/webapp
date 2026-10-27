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
      const travelId = String(t.id || buy.id || Math.random());

      const agentName = (buy.agent?.name || 'Sin Comisionista').trim();
      const agentPercent = buy.agent?.percent || 0;

      if (!agentCompMap.has(agentName)) {
        agentCompMap.set(agentName, {
          name: agentName,
          percent: agentPercent,
          travelIds: new Set(),
          heads: 0,
          kgClean: 0,
          kgFaena: 0,
          kgForYield: 0,
          totalOp: 0,
          totalOpWithComm: 0,
          totalCommission: 0,
          weightedSellRef: 0,
          refKg: 0,
          producersMap: new Map()
        });
      }
      const aComp = agentCompMap.get(agentName);

      (buy.listOfProducers || []).forEach(p => {
        const prodName = (p.producer?.name || p.name || 'Productor').trim();
        const prodCuit = String(p.producer?.cuit || p.cuit || '').trim();
        const prodOrigin = p.origin || '';

        if (!prodCompMap.has(prodName)) {
          prodCompMap.set(prodName, {
            name: prodName,
            cuit: prodCuit,
            origin: prodOrigin,
            travelIds: new Set(),
            heads: 0,
            kgClean: 0,
            kgFaena: 0,
            kgForYield: 0,
            totalOp: 0,
            totalOpWithComm: 0,
            weightedSellRef: 0,
            refKg: 0,
            agentsMap: new Map()
          });
        }
        const pComp = prodCompMap.get(prodName);

        // Sub-producer within agent
        if (!aComp.producersMap.has(prodName)) {
          aComp.producersMap.set(prodName, {
            name: prodName,
            cuit: prodCuit,
            origin: prodOrigin,
            travelIds: new Set(),
            heads: 0,
            kgClean: 0,
            kgFaena: 0,
            kgForYield: 0,
            totalOp: 0,
            totalOpWithComm: 0,
            weightedSellRef: 0,
            refKg: 0
          });
        }
        const aSubProd = aComp.producersMap.get(prodName);

        // Sub-agent within producer
        if (!pComp.agentsMap.has(agentName)) {
          pComp.agentsMap.set(agentName, {
            name: agentName,
            percent: agentPercent,
            travelIds: new Set(),
            heads: 0,
            kgClean: 0,
            kgFaena: 0,
            kgForYield: 0,
            totalOp: 0,
            totalOpWithComm: 0,
            weightedSellRef: 0,
            refKg: 0
          });
        }
        const pSubAgent = pComp.agentsMap.get(agentName);

        // Cross Cell (agent x producer)
        const crossKey = `${agentName}:::${prodName}`;
        if (!crossCompMap.has(crossKey)) {
          crossCompMap.set(crossKey, {
            agentName,
            producerName: prodName,
            cuit: prodCuit,
            travelIds: new Set(),
            heads: 0,
            kgClean: 0,
            kgFaena: 0,
            kgForYield: 0,
            totalOp: 0,
            totalOpWithComm: 0,
            weightedSellRef: 0,
            refKg: 0
          });
        }
        const crossEntry = crossCompMap.get(crossKey);

        (p.listOfProducts || []).forEach(pr => {
          const catName = pr.standardizedCategory || pr.name || 'OTRO';
          if (isAll || catsToFilter.includes(catName)) {
            const cleanKg = pr.kgClean || 0;
            const faenaKg = pr.kgFaena || 0;
            const qty = pr.quantity || 0;
            const op = pr.operation || 0;
            const opWithComm = op * (1 + agentPercent / 100);
            const commAmount = opWithComm - op;
            const refPrice = parseFloat(categoryPrices[catName]) || 0;

            // Only mark travel as visited if there are matching category items
            aComp.travelIds.add(travelId);
            pComp.travelIds.add(travelId);
            aSubProd.travelIds.add(travelId);
            pSubAgent.travelIds.add(travelId);
            crossEntry.travelIds.add(travelId);

            // Update Agent Aggregate
            aComp.heads += qty;
            aComp.kgClean += cleanKg;
            aComp.kgFaena += faenaKg;
            if (faenaKg > 0) {
              aComp.kgForYield += cleanKg;
            }
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
            if (faenaKg > 0) {
              pComp.kgForYield += cleanKg;
            }
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
            if (faenaKg > 0) {
              aSubProd.kgForYield += cleanKg;
            }
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
            if (faenaKg > 0) {
              pSubAgent.kgForYield += cleanKg;
            }
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
            if (faenaKg > 0) {
              crossEntry.kgForYield += cleanKg;
            }
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

    // Transform maps to structured sorted arrays (filtering out empty ghost records)
    const agentComparisons = Array.from(agentCompMap.values())
      .filter(a => a.heads > 0 || a.kgClean > 0)
      .map(a => {
        // Use kgForYield so pending unslaughtered travels do not distort the real slaughter yield
        const yieldPct = a.kgForYield > 0 ? (a.kgFaena / a.kgForYield) * 100 : 0;
        const avgPrice = a.kgClean > 0 ? (a.totalOp / a.kgClean) : 0;
        const avgPriceWithComm = a.kgClean > 0 ? (a.totalOpWithComm / a.kgClean) : 0;
        const costVivo = includeCommission ? avgPriceWithComm : avgPrice;
        const yieldRatio = yieldPct > 0 ? (yieldPct / 100) : 0;
        const costoGancho = yieldRatio > 0 ? (costVivo / yieldRatio) : 0;
        const realCostGancho = costoGancho > 0 ? (costoGancho / (1 - 0.017)) : 0;
        const sellPriceRef = a.refKg > 0 && a.weightedSellRef > 0 ? (a.weightedSellRef / a.refKg) : 0;
        const margin = (sellPriceRef > 0 && realCostGancho > 0) ? (sellPriceRef - realCostGancho) : 0;
        const marginPct = (sellPriceRef > 0 && realCostGancho > 0) ? (margin / realCostGancho) * 100 : 0;

        const producers = Array.from(a.producersMap.values())
          .filter(p => p.heads > 0 || p.kgClean > 0)
          .map(p => {
            const pYield = p.kgForYield > 0 ? (p.kgFaena / p.kgForYield) * 100 : 0;
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
              travelCount: p.travelIds.size,
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
          travelCount: a.travelIds.size,
          travelIds: Array.from(a.travelIds),
          heads: a.heads,
          kgClean: a.kgClean,
          kgFaena: a.kgFaena,
          kgForYield: a.kgForYield,
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

    const producerComparisons = Array.from(prodCompMap.values())
      .filter(p => p.heads > 0 || p.kgClean > 0)
      .map(p => {
        const yieldPct = p.kgForYield > 0 ? (p.kgFaena / p.kgForYield) * 100 : 0;
        const avgPrice = p.kgClean > 0 ? (p.totalOp / p.kgClean) : 0;
        const avgPriceWithComm = p.kgClean > 0 ? (p.totalOpWithComm / p.kgClean) : 0;
        const costVivo = includeCommission ? avgPriceWithComm : avgPrice;
        const yieldRatio = yieldPct > 0 ? (yieldPct / 100) : 0;
        const costoGancho = yieldRatio > 0 ? (costVivo / yieldRatio) : 0;
        const realCostGancho = costoGancho > 0 ? (costoGancho / (1 - 0.017)) : 0;
        const sellPriceRef = p.refKg > 0 && p.weightedSellRef > 0 ? (p.weightedSellRef / p.refKg) : 0;
        const margin = (sellPriceRef > 0 && realCostGancho > 0) ? (sellPriceRef - realCostGancho) : 0;
        const marginPct = (sellPriceRef > 0 && realCostGancho > 0) ? (margin / realCostGancho) * 100 : 0;

        const agents = Array.from(p.agentsMap.values())
          .filter(a => a.heads > 0 || a.kgClean > 0)
          .map(a => {
            const aYield = a.kgForYield > 0 ? (a.kgFaena / a.kgForYield) * 100 : 0;
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
              travelCount: a.travelIds.size,
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
          travelCount: p.travelIds.size,
          travelIds: Array.from(p.travelIds),
          heads: p.heads,
          kgClean: p.kgClean,
          kgFaena: p.kgFaena,
          kgForYield: p.kgForYield,
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

    // Cross matrix compilation
    const crossMatrix = {
      agents: agentComparisons.map(a => a.name),
      producers: producerComparisons.map(p => p.name),
      cells: {}
    };
    crossCompMap.forEach((entry, key) => {
      if (entry.heads === 0 && entry.kgClean === 0) return;
      const yPct = entry.kgForYield > 0 ? (entry.kgFaena / entry.kgForYield) * 100 : 0;
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
        travelCount: entry.travelIds.size,
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

    // Consolidated totals across all compared agents
    const allComparisonTravelIds = new Set();
    let totalCompHeads = 0;
    let totalCompKgClean = 0;
    let totalCompKgFaena = 0;
    let totalCompKgForYield = 0;
    let totalCompOp = 0;
    let totalCompOpWithComm = 0;
    let totalCompCommission = 0;
    let totalCompWeightedSellRef = 0;
    let totalCompRefKg = 0;

    agentComparisons.forEach(a => {
      totalCompHeads += a.heads;
      totalCompKgClean += a.kgClean;
      totalCompKgFaena += a.kgFaena;
      totalCompKgForYield += a.kgForYield;
      totalCompOp += a.totalOp;
      totalCompOpWithComm += a.totalOpWithCommission;
      totalCompCommission += a.totalCommission;
      if (a.sellPriceRef > 0 && a.refKg > 0) {
        totalCompWeightedSellRef += a.sellPriceRef * a.refKg;
        totalCompRefKg += a.refKg;
      }
      (a.travelIds || []).forEach(id => allComparisonTravelIds.add(id));
    });

    const totalCompYieldPct = totalCompKgForYield > 0 ? (totalCompKgFaena / totalCompKgForYield) * 100 : 0;
    const totalCompAvgPrice = totalCompKgClean > 0 ? (totalCompOp / totalCompKgClean) : 0;
    const totalCompAvgPriceWithComm = totalCompKgClean > 0 ? (totalCompOpWithComm / totalCompKgClean) : 0;
    const totalCompCostVivo = includeCommission ? totalCompAvgPriceWithComm : totalCompAvgPrice;
    const totalCompYieldRatio = totalCompYieldPct > 0 ? (totalCompYieldPct / 100) : 0;
    const totalCompCostoGancho = totalCompYieldRatio > 0 ? (totalCompCostVivo / totalCompYieldRatio) : 0;
    const totalCompRealCostGancho = totalCompCostoGancho > 0 ? (totalCompCostoGancho / (1 - 0.017)) : 0;
    const totalCompSellPriceRef = totalCompRefKg > 0 ? (totalCompWeightedSellRef / totalCompRefKg) : 0;
    const totalCompMargin = (totalCompSellPriceRef > 0 && totalCompRealCostGancho > 0) ? (totalCompSellPriceRef - totalCompRealCostGancho) : 0;
    const totalCompMarginPct = (totalCompSellPriceRef > 0 && totalCompRealCostGancho > 0) ? (totalCompMargin / totalCompRealCostGancho) * 100 : 0;

    const totals = {
      travelCount: allComparisonTravelIds.size,
      heads: totalCompHeads,
      kgClean: totalCompKgClean,
      kgFaena: totalCompKgFaena,
      kgForYield: totalCompKgForYield,
      yieldPct: totalCompYieldPct,
      avgPrice: totalCompAvgPrice,
      avgPriceWithCommission: totalCompAvgPriceWithComm,
      costoGancho: totalCompCostoGancho,
      realCostGancho: totalCompRealCostGancho,
      sellPriceRef: totalCompSellPriceRef,
      margin: totalCompMargin,
      marginPct: totalCompMarginPct,
      totalOp: totalCompOp,
      totalOpWithCommission: totalCompOpWithComm,
      totalCommission: totalCompCommission
    };

    const comparisons = {
      agents: agentComparisons,
      producers: producerComparisons,
      crossMatrix,
      totals
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
