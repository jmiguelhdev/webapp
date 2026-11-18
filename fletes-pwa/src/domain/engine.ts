// Port 1:1 de:
// - IosFletes/Engine/TravelCalculator.swift
// - IosFletes/Engine/TruckEfficiencyCalculator.swift
// - IosFletes/Engine/OdometerOCRScanner.swift

import { Formatters } from '../utils/formatters';
import {
  AppConfig,
  Bill,
  Buy,
  Product,
  Travel,
  applyAgentContextToBuy,
  calculateTravelFuelEfficiency,
  getBuyReductionForProducts,
  getBuyTotalOperation,
  getBuyTotalQuantity,
  getProductFactura,
  getProductKgClean,
  getProductOperation,
  getProductOperationWithCommission,
} from './models';

// =============================================================================
// 1. TravelCalculator
// =============================================================================

export const TravelCalculator = {
  distributeKgFaena(buy: Buy, globalAmount: number): Buy {
    const totalQuantity = getBuyTotalQuantity(buy);
    if (totalQuantity <= 0 || globalAmount <= 0) return buy;

    return {
      ...buy,
      kgFaenaGlobal: globalAmount,
      listOfProducers: (buy.listOfProducers || []).map((prod) => ({
        ...prod,
        listOfProducts: (prod.listOfProducts || []).map((p) => ({
          ...p,
          kgFaena: globalAmount * ((p.quantity || 0) / totalQuantity),
          isKgFaenaProrated: true,
        })),
      })),
    };
  },

  prorateReduction(buy: Buy): Buy {
    const amountToDistribute = getBuyReductionForProducts(buy);
    if (amountToDistribute <= 0) {
      return {
        ...buy,
        listOfProducers: (buy.listOfProducers || []).map((prod) => ({
          ...prod,
          listOfProducts: (prod.listOfProducts || []).map((p) => ({
            ...p,
            reduce: 0.0,
          })),
        })),
      };
    }

    const totalBasis = getBuyTotalOperation(buy);
    const useQuantityAsFallback = totalBasis === 0;
    const totalQuantity = getBuyTotalQuantity(buy);
    if (useQuantityAsFallback && totalQuantity === 0) return buy;

    const allProductsCount = (buy.listOfProducers || []).reduce(
      (acc, p) => acc + (p.listOfProducts?.length || 0),
      0
    );
    if (allProductsCount === 0) return buy;

    let distributedSoFar = 0;
    let currentProductIndex = 0;

    return {
      ...buy,
      listOfProducers: (buy.listOfProducers || []).map((prod) => ({
        ...prod,
        listOfProducts: (prod.listOfProducts || []).map((product) => {
          currentProductIndex += 1;
          let proratedReduce = 0;

          if (currentProductIndex === allProductsCount) {
            proratedReduce = Math.max(0.0, amountToDistribute - distributedSoFar);
          } else {
            let ratio = 0;
            if (useQuantityAsFallback) {
              ratio = totalQuantity > 0 ? (product.quantity || 0) / totalQuantity : 0;
            } else {
              ratio = totalBasis > 0 ? getProductOperation(product) / totalBasis : 0;
            }
            const amount = amountToDistribute * ratio;
            distributedSoFar += amount;
            proratedReduce = amount;
          }

          return {
            ...product,
            reduce: proratedReduce,
          };
        }),
      })),
    };
  },

  calculateTaxes(
    buy: Buy,
    recurringProducerIds: Set<number> = new Set(),
    config: AppConfig
  ): Buy {
    const totalOp = getBuyTotalOperation(buy);
    const shouldTaxBeZero =
      totalOp <= 0 || ((buy.totalReduce || 0) > 0 && getBuyReductionForProducts(buy) >= totalOp);
    const ivaRate = (config.ivaRate || 0) / 100.0;
    const gananciasRate = (config.gananciasRate || 0) / 100.0;
    const minimoNoImponible = config.gananciasMinThreshold || 0;

    return {
      ...buy,
      listOfProducers: (buy.listOfProducers || []).map((producer) => {
        const isRecurring = recurringProducerIds.has(producer.id);
        let mniToApply = isRecurring ? 0.0 : minimoNoImponible;

        return {
          ...producer,
          listOfProducts: (producer.listOfProducts || []).map((product) => {
            if (shouldTaxBeZero) {
              return {
                ...product,
                taxes: {
                  ...product.taxes,
                  bill: { neto: 0, iva: 0, ganancias: 0 },
                },
              };
            }

            const existingIva = product.taxes?.bill?.iva || 0;
            const productNeto = product.isIvaManual
              ? ivaRate > 0
                ? existingIva / ivaRate
                : 0
              : getProductFactura(product) / (1.0 + ivaRate);

            const ivaCalculated = product.isIvaManual ? existingIva : productNeto * ivaRate;
            const appliedMni = mniToApply > 0 ? Math.min(productNeto, mniToApply) : 0;
            mniToApply -= appliedMni;

            const baseImponible = Math.max(0.0, productNeto - appliedMni);
            const gananciasCalculated = baseImponible * gananciasRate;

            return {
              ...product,
              taxes: {
                ...product.taxes,
                bill: {
                  neto: productNeto,
                  iva: ivaCalculated,
                  ganancias: gananciasCalculated,
                },
              },
            };
          }),
        };
      }),
    };
  },

  applyFullCalculation(
    buy: Buy,
    config: AppConfig,
    recurringProducerIds: Set<number> = new Set()
  ): Buy {
    const buyWithAgent = applyAgentContextToBuy(buy);
    const buyWithProrate = this.prorateReduction(buyWithAgent);
    return this.calculateTaxes(buyWithProrate, recurringProducerIds, config);
  },

  applyManualTaxes(
    buy: Buy,
    manualBills: Map<number, Bill>,
    config: AppConfig,
    recurringProducerIds: Set<number> = new Set()
  ): Buy {
    const updatedBuy: Buy = {
      ...buy,
      listOfProducers: (buy.listOfProducers || []).map((prod) => ({
        ...prod,
        listOfProducts: (prod.listOfProducts || []).map((p) => {
          const bill = manualBills.get(p.id);
          if (!bill) return p;
          return {
            ...p,
            isIvaManual: true,
            taxes: { ...p.taxes, bill },
          };
        }),
      })),
    };
    return this.calculateTaxes(updatedBuy, recurringProducerIds, config);
  },
};

export function calculateProductSimulatorCost(
  product: Product,
  fleteTotal: number,
  totalKgCleanBuy: number,
  iibbPercent: number,
  profitMargin: number
): number {
  if ((product.kgFaena || 0) <= 0) return 0;

  const haciendaCostPerKgCarne = getProductOperationWithCommission(product) / product.kgFaena;
  const kgClean = getProductKgClean(product);
  const weightRatio = totalKgCleanBuy > 0 ? kgClean / totalKgCleanBuy : 0;
  const fleteProrated = fleteTotal * weightRatio;
  const fleteCostPerKgCarne = fleteProrated / product.kgFaena;

  const baseBruta = haciendaCostPerKgCarne + fleteCostPerKgCarne;
  const tasaImpuestos = profitMargin * (iibbPercent / 100.0);
  const divisor = 1.0 - tasaImpuestos;

  return divisor > 0 ? baseBruta / divisor : baseBruta;
}

// =============================================================================
// 2. TruckEfficiencyCalculator
// =============================================================================

export type FuelAnomalyType = 'NONE' | 'LOW' | 'HIGH';

export interface TruckEfficiencyResult {
  travelId: number;
  kmOnPump: number;
  previousKmOnPump: number;
  diffKm: number;
  litersOnPump: number;
  efficiency: number;
  isFirstTravel: boolean;
  anomalyType: FuelAnomalyType;
}

export function getFuelAnomalyDisplayName(type: FuelAnomalyType): string {
  switch (type) {
    case 'NONE': return 'Normal';
    case 'LOW': return 'Alto Consumo (< 2.4 km/l)';
    case 'HIGH': return 'Rendimiento Atípico (> 3.5 km/l)';
  }
}

export const TruckEfficiencyCalculator = {
  minNormalEfficiency: 2.4,
  maxNormalEfficiency: 3.5,

  evaluateAnomaly(efficiency: number, isFirstTravel: boolean): FuelAnomalyType {
    if (isFirstTravel || efficiency <= 0) return 'NONE';
    if (efficiency < this.minNormalEfficiency) return 'LOW';
    if (efficiency > this.maxNormalEfficiency) return 'HIGH';
    return 'NONE';
  },

  findPreviousKmOnPump(travel: Travel, allTravels: Travel[]): number | null {
    const truckId = travel.truck?.id || 0;
    if (truckId === 0) return null;

    const truckTravels = allTravels.filter(
      (t) => t.truck?.id === truckId && t.id !== travel.id && (t.kmOnPump || 0) > 0
    );

    if ((travel.kmOnPump || 0) > 0) {
      const earlier = truckTravels.filter((t) => t.kmOnPump < travel.kmOnPump);
      if (earlier.length > 0) {
        return earlier.reduce((max, t) => (t.kmOnPump > max ? t.kmOnPump : max), 0);
      }
    }

    const sortedByDate = [...truckTravels].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.kmOnPump - b.kmOnPump;
    });

    const idx = sortedByDate.findIndex((t) => t.id === travel.id);
    if (idx > 0) return sortedByDate[idx - 1].kmOnPump;
    return sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].kmOnPump : null;
  },

  calculateSingleEfficiency(
    travelId: number,
    kmOnPump: number,
    previousKmOnPump: number | null,
    litersOnPump: number
  ): TruckEfficiencyResult {
    if (!previousKmOnPump || previousKmOnPump <= 0) {
      return {
        travelId,
        kmOnPump,
        previousKmOnPump: 0,
        diffKm: 0,
        litersOnPump,
        efficiency: 0,
        isFirstTravel: kmOnPump > 0,
        anomalyType: 'NONE',
      };
    }

    if (kmOnPump <= previousKmOnPump || litersOnPump <= 0) {
      return {
        travelId,
        kmOnPump,
        previousKmOnPump,
        diffKm: Math.max(0, kmOnPump - previousKmOnPump),
        litersOnPump,
        efficiency: 0,
        isFirstTravel: false,
        anomalyType: 'NONE',
      };
    }

    const diff = kmOnPump - previousKmOnPump;
    const efficiency = diff / litersOnPump;
    return {
      travelId,
      kmOnPump,
      previousKmOnPump,
      diffKm: diff,
      litersOnPump,
      efficiency,
      isFirstTravel: false,
      anomalyType: this.evaluateAnomaly(efficiency, false),
    };
  },

  calculateFleetEfficiencies(travels: Travel[]): Map<number, TruckEfficiencyResult> {
    const results = new Map<number, TruckEfficiencyResult>();
    const byTruck = new Map<number, Travel[]>();

    for (const t of travels) {
      const truckId = t.truck?.id || 0;
      const list = byTruck.get(truckId) || [];
      list.push(t);
      byTruck.set(truckId, list);
    }

    for (const [, truckTravels] of byTruck.entries()) {
      const sorted = [...truckTravels].sort((a, b) => (a.kmOnPump || 0) - (b.kmOnPump || 0));
      let lastValidRefKm = 0;

      for (const travel of sorted) {
        const hasValidData =
          (travel.kmOnPump || 0) > 0 && (travel.litersOnPump || 0) > 0 && lastValidRefKm > 0;
        const isFirst = lastValidRefKm === 0 && (travel.kmOnPump || 0) > 0;

        const diff =
          hasValidData && travel.kmOnPump > lastValidRefKm ? travel.kmOnPump - lastValidRefKm : 0;
        const eff = hasValidData ? calculateTravelFuelEfficiency(travel, lastValidRefKm) : 0;
        const anomalyType = this.evaluateAnomaly(eff, isFirst);

        results.set(travel.id, {
          travelId: travel.id,
          kmOnPump: travel.kmOnPump || 0,
          previousKmOnPump: lastValidRefKm,
          diffKm: diff,
          litersOnPump: travel.litersOnPump || 0,
          efficiency: eff,
          isFirstTravel: isFirst,
          anomalyType,
        });

        if ((travel.kmOnPump || 0) > 0 && (travel.litersOnPump || 0) > 0) {
          lastValidRefKm = travel.kmOnPump;
        } else if (lastValidRefKm === 0 && (travel.kmOnPump || 0) > 0) {
          lastValidRefKm = travel.kmOnPump;
        }
      }
    }

    return results;
  },
};

// =============================================================================
// 3. OdometerOCRScanner
// =============================================================================

export interface OdometerCandidate {
  id: string;
  value: number;
  formattedValue: string;
  rawText: string;
  confidence: number;
  isLikelyTotalOdometer: boolean;
}

export interface OdometerScanResult {
  candidates: OdometerCandidate[];
  recognizedLines: string[];
}

export const OdometerOCRScanner = {
  parseNumber(str: string): number | null {
    let clean = (str || '').trim().replace(/\s+/g, '');
    if (!clean) return null;

    if (clean.includes('.') && clean.includes(',')) {
      const dotIdx = clean.indexOf('.');
      const commaIdx = clean.lastIndexOf(',');
      if (dotIdx < commaIdx) {
        clean = clean.replace(/\./g, '').replace(/,/g, '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts.length > 1 && parts.slice(1).every((p) => p.length === 3)) {
        clean = clean.replace(/\./g, '');
      }
    } else if (clean.includes(',')) {
      const parts = clean.split(',');
      if (parts.length > 1 && parts.slice(1).every((p) => p.length === 3)) {
        clean = clean.replace(/,/g, '');
      } else {
        clean = clean.replace(/,/g, '.');
      }
    }

    const parsed = Number(clean);
    return Number.isFinite(parsed) ? parsed : null;
  },

  extractCandidatesFromLines(
    lines: Array<{ text: string; confidence?: number }>
  ): OdometerScanResult {
    const pattern = /(?:\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)/g;
    const found: OdometerCandidate[] = [];
    const recognizedLines: string[] = [];

    for (const line of lines) {
      const lineText = (line.text || '').trim();
      if (!lineText) continue;
      recognizedLines.push(lineText);

      const confidence = line.confidence ?? 0.85;
      const matches = lineText.match(pattern) || [];

      for (const matchStr of matches) {
        const parsedVal = this.parseNumber(matchStr);
        if (!parsedVal || parsedVal <= 0) continue;

        const isLikelyTotal = parsedVal >= 1000 && parsedVal <= 5_000_000;
        const decimals = parsedVal % 1 === 0 ? 0 : 1;

        found.push({
          id: `${parsedVal}_${found.length}`,
          value: parsedVal,
          formattedValue: Formatters.decimal(parsedVal, decimals),
          rawText: matchStr,
          confidence,
          isLikelyTotalOdometer: isLikelyTotal,
        });
      }
    }

    found.sort((a, b) => {
      if (a.isLikelyTotalOdometer !== b.isLikelyTotalOdometer) {
        return a.isLikelyTotalOdometer ? -1 : 1;
      }
      if (Math.abs(a.confidence - b.confidence) > 0.2) {
        return b.confidence - a.confidence;
      }
      return b.value - a.value;
    });

    const unique: OdometerCandidate[] = [];
    const seen = new Set<number>();
    for (const item of found) {
      if (!seen.has(item.value)) {
        seen.add(item.value);
        unique.push(item);
      }
    }

    return { candidates: unique, recognizedLines };
  },

  async scanImageFile(file: File): Promise<OdometerScanResult> {
    const win = window as unknown as {
      Tesseract?: {
        recognize: (
          img: File | Blob | string,
          lang: string,
          opts?: Record<string, unknown>
        ) => Promise<{
          data?: {
            text?: string;
            lines?: Array<{ text?: string; confidence?: number }>;
          };
        }>;
      };
    };

    if (!win.Tesseract) {
      throw new Error(
        'El motor OCR Tesseract.js no está disponible offline o aún está cargando. Ingresá el valor manualmente.'
      );
    }

    const res = await win.Tesseract.recognize(file, 'eng+spa');
    const rawLines = res?.data?.lines;
    if (Array.isArray(rawLines) && rawLines.length > 0) {
      return this.extractCandidatesFromLines(
        rawLines.map((l) => ({
          text: l.text || '',
          confidence: typeof l.confidence === 'number' ? l.confidence / 100 : 0.85,
        }))
      );
    }

    const text = res?.data?.text || '';
    const splitLines = text
      .split(/\r?\n/)
      .map((t) => ({ text: t.trim(), confidence: 0.85 }))
      .filter((l) => l.text.length > 0);

    return this.extractCandidatesFromLines(splitLines);
  },
};
