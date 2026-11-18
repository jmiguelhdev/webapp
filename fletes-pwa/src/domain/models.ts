// Port 1:1 de los modelos de dominio en IosFletes/Models/

import { Formatters } from '../utils/formatters';

export type TravelStatus = 'DRAFT' | 'ACTIVE' | 'FLETE';
export type TrailerType = 'SIMPLE' | 'DOUBLE';
export type ProductCategory =
  | 'TODOS'
  | 'NOVILLO'
  | 'VACA'
  | 'TORO'
  | 'VAQUILLONA'
  | 'NOVILLITO'
  | 'MEJ'
  | 'OTRO';

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error';

export interface Driver {
  id: number;
  name: string;
  dni: string;
  license: string;
}

export interface Trailer {
  id: number;
  name: string;
  licensePlate: string;
  vtvExpiration: string;
  senasaExpiration: string;
  type: TrailerType;
}

export interface Truck {
  id: number;
  name: string;
  licensePlate: string;
  vtvExpiration: string;
  insuranceExpiration: string;
  driver: Driver;
  trailer: Trailer;
  averageEfficiency: number;
  isFreightPaid: boolean;
  updatedAt: number;
  isDirty?: boolean;
  isDeleted?: boolean;
}

export interface Bill {
  neto: number;
  iva: number;
  ganancias: number;
}

export interface Taxes {
  id: number;
  date: string;
  bill: Bill;
}

export interface Product {
  id: number;
  name: string;
  quantity: number;
  kg: number;
  roughing: number; // % de desbaste (ej: 3.0)
  price: number;
  total: number;
  reduce: number; // Achique prorrateado en $
  taxes: Taxes;
  kgFaena: number;
  isKgFaenaProrated: boolean;
  isIvaManual: boolean;
  agentCommissionPercent: number;
}

export interface Producer {
  id: number;
  name: string;
  phone: string;
  cuit: string;
  cbu: string;
  listOfProducts: Product[];
  usageCount: number;
}

export interface Agent {
  id: number;
  name: string;
  phone: string;
  percent: number;
  usageCount: number;
}

export interface AgentPayment {
  id: number;
  agentId: number;
  amount: number;
  date: string;
  description: string;
  updatedAt: number;
}

export interface Buy {
  id: number;
  date: string;
  truckId: number;
  listOfProducers: Producer[];
  agent: Agent | null;
  totalReduce: number;
  reducePercent: number | null;
  kgFaenaGlobal: number;
}

export interface Expense {
  id: number;
  travelId: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  isReimbursable: boolean;
}

export const EXPENSE_CATEGORIES = [
  'Peajes',
  'Combustible Extra',
  'Viáticos',
  'Gomería / Reparación',
  'Lavado',
  'Estadía',
  'Otro',
] as const;

export interface Travel {
  id: number;
  rawDocId?: string;
  status: TravelStatus;
  truck: Truck;
  kmOnOrigin: number;
  kmOnDestination: number;
  kmOnPump: number;
  litersOnPump: number;
  date: string;
  description: string;
  pricePerKm: number;
  driverPricePerKmSimple: number;
  driverPricePerKmDouble: number;
  fuelPrice: number;
  simulationFreightPriceSimple: number;
  simulationFreightPriceDouble: number;
  buy: Buy;
  kgFaenaTotal: number;
  coefImposturesSobreLaVenta: number;
  yieldCorrectionKg: number;
  yieldCorrectionAmount: number;
  isOnlyFreight: boolean;
  freightPriceSimpleSnapshot: number;
  freightStartFeeSimpleSnapshot: number;
  freightPriceDoubleSnapshot: number;
  freightStartFeeDoubleSnapshot: number;
  expenses: Expense[];
  updatedAt: number;
  isDirty: boolean;
}

export interface AppConfig {
  id: string;
  ivaRate: number;
  gananciasRate: number;
  gananciasMinThreshold: number;
  defaultDriverPricePerKmSimple: number;
  defaultDriverPricePerKmDouble: number;
  defaultFreightPricePerKm: number;
  fuelPrice: number;
  simulationFreightPriceSimple: number;
  simulationFreightPriceDouble: number;
  defaultPorcentajeIIBB: number;
  defaultProfitMargin: number;
  freightPriceSimple: number;
  freightStartFeeSimple: number;
  freightPriceDouble: number;
  freightStartFeeDouble: number;
  updatedAt: number;
  isDirty?: boolean;
}

// MARK: - ID & Factory Helpers

export function generateNumericId(): number {
  return Date.now() + Math.floor(Math.random() * 999) + 1;
}

export function createDefaultConfig(overrides?: Partial<AppConfig>): AppConfig {
  return {
    id: 'default',
    ivaRate: 10.5,
    gananciasRate: 2.0,
    gananciasMinThreshold: 4480.0,
    defaultDriverPricePerKmSimple: 150.0,
    defaultDriverPricePerKmDouble: 200.0,
    defaultFreightPricePerKm: 500.0,
    fuelPrice: 1000.0,
    simulationFreightPriceSimple: 2500.0,
    simulationFreightPriceDouble: 3100.0,
    defaultPorcentajeIIBB: 1.7,
    defaultProfitMargin: 1.1,
    freightPriceSimple: 100.0,
    freightStartFeeSimple: 5000.0,
    freightPriceDouble: 150.0,
    freightStartFeeDouble: 8000.0,
    updatedAt: Date.now(),
    isDirty: false,
    ...overrides,
  };
}

export function createDriver(overrides?: Partial<Driver>): Driver {
  return {
    id: generateNumericId(),
    name: '',
    dni: '',
    license: '',
    ...overrides,
  };
}

export function createTrailer(overrides?: Partial<Trailer>): Trailer {
  return {
    id: generateNumericId(),
    name: '',
    licensePlate: '',
    vtvExpiration: '',
    senasaExpiration: '',
    type: 'SIMPLE',
    ...overrides,
  };
}

export function createTruck(overrides?: Partial<Truck>): Truck {
  return {
    id: generateNumericId(),
    name: '',
    licensePlate: '',
    vtvExpiration: '',
    insuranceExpiration: '',
    driver: createDriver({ id: 0 }),
    trailer: createTrailer({ id: 0 }),
    averageEfficiency: 0,
    isFreightPaid: false,
    updatedAt: Date.now(),
    isDirty: false,
    isDeleted: false,
    ...overrides,
  };
}

export function createBill(overrides?: Partial<Bill>): Bill {
  return {
    neto: 0,
    iva: 0,
    ganancias: 0,
    ...overrides,
  };
}

export function createProduct(overrides?: Partial<Product>): Product {
  return {
    id: generateNumericId(),
    name: '',
    quantity: 0,
    kg: 0,
    roughing: 3.0,
    price: 0,
    total: 0,
    reduce: 0,
    taxes: {
      id: generateNumericId(),
      date: '',
      bill: createBill(),
    },
    kgFaena: 0,
    isKgFaenaProrated: false,
    isIvaManual: false,
    agentCommissionPercent: 0,
    ...overrides,
  };
}

export function createProducer(overrides?: Partial<Producer>): Producer {
  return {
    id: generateNumericId(),
    name: '',
    phone: '',
    cuit: '',
    cbu: '',
    listOfProducts: [],
    usageCount: 0,
    ...overrides,
  };
}

export function createAgent(overrides?: Partial<Agent>): Agent {
  return {
    id: generateNumericId(),
    name: '',
    phone: '',
    percent: 0,
    usageCount: 0,
    ...overrides,
  };
}

export function createBuy(overrides?: Partial<Buy>): Buy {
  return {
    id: generateNumericId(),
    date: Formatters.isoDate(new Date()),
    truckId: 0,
    listOfProducers: [],
    agent: null,
    totalReduce: 0,
    reducePercent: null,
    kgFaenaGlobal: 0,
    ...overrides,
  };
}

export function createExpense(overrides?: Partial<Expense>): Expense {
  return {
    id: generateNumericId(),
    travelId: 0,
    description: '',
    amount: 0,
    category: 'Peajes',
    date: Formatters.isoDate(new Date()),
    isReimbursable: true,
    ...overrides,
  };
}

export function createTravel(config: AppConfig = createDefaultConfig(), overrides?: Partial<Travel>): Travel {
  const todayIso = Formatters.isoDate(new Date());
  return {
    id: generateNumericId(),
    status: 'DRAFT',
    truck: createTruck({ id: 0 }),
    kmOnOrigin: 0,
    kmOnDestination: 0,
    kmOnPump: 0,
    litersOnPump: 0,
    date: todayIso,
    description: '',
    pricePerKm: config.defaultFreightPricePerKm || 500,
    driverPricePerKmSimple: config.defaultDriverPricePerKmSimple || 150,
    driverPricePerKmDouble: config.defaultDriverPricePerKmDouble || 200,
    fuelPrice: config.fuelPrice || 1000,
    simulationFreightPriceSimple: config.simulationFreightPriceSimple || 2500,
    simulationFreightPriceDouble: config.simulationFreightPriceDouble || 3100,
    buy: createBuy({ date: todayIso }),
    kgFaenaTotal: 0,
    coefImposturesSobreLaVenta: 1.0,
    yieldCorrectionKg: 0,
    yieldCorrectionAmount: 0,
    isOnlyFreight: false,
    freightPriceSimpleSnapshot: config.freightPriceSimple || 100,
    freightStartFeeSimpleSnapshot: config.freightStartFeeSimple || 5000,
    freightPriceDoubleSnapshot: config.freightPriceDouble || 150,
    freightStartFeeDoubleSnapshot: config.freightStartFeeDouble || 8000,
    expenses: [],
    updatedAt: Date.now(),
    isDirty: false,
    ...overrides,
  };
}

// MARK: - ProductCategory Resolution

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'TODOS',
  'NOVILLO',
  'VACA',
  'TORO',
  'VAQUILLONA',
  'NOVILLITO',
  'MEJ',
  'OTRO',
];

export function resolveProductCategory(name: string): ProductCategory {
  const clean = (name || '').trim().toLowerCase();
  if (clean.startsWith('mej')) return 'MEJ';
  if (clean.startsWith('nto') || clean.includes('novillito')) return 'NOVILLITO';
  if (clean.startsWith('novillo') || clean.startsWith('nov') || clean.startsWith('no ')) return 'NOVILLO';
  if (clean.startsWith('vq') || clean.startsWith('vaq')) return 'VAQUILLONA';
  if (clean.startsWith('vaca') || clean.startsWith('vac') || clean.startsWith('va')) return 'VACA';
  if (clean.startsWith('to') || clean.startsWith('toro')) return 'TORO';
  return 'OTRO';
}

export function getCategoryDisplayName(cat: ProductCategory): string {
  switch (cat) {
    case 'TODOS': return 'Todos';
    case 'NOVILLO': return 'Novillo';
    case 'VACA': return 'Vaca';
    case 'TORO': return 'Toro';
    case 'VAQUILLONA': return 'Vaquillona';
    case 'NOVILLITO': return 'Novillito';
    case 'MEJ': return 'MEJ';
    case 'OTRO': return 'Otro';
  }
}

export function getCategoryColor(cat: ProductCategory): string {
  switch (cat) {
    case 'NOVILLO': return '#1a73e8';
    case 'VACA': return '#bf73ff';
    case 'TORO': return '#ff453a';
    case 'VAQUILLONA': return '#ff8c00';
    case 'NOVILLITO': return '#00e5ff';
    case 'MEJ': return '#6366f1';
    default: return '#8e9da8';
  }
}

// MARK: - Computed Properties (1:1 with Swift structs)

export function getBillFactura(bill: Bill): number {
  return (bill?.neto || 0) + (bill?.iva || 0) + (bill?.ganancias || 0);
}

export function getProductKgClean(p: Product): number {
  return (p.kg || 0) * (1.0 - (p.roughing || 0) / 100.0);
}

export function getProductOperation(p: Product): number {
  return getProductKgClean(p) * (p.price || 0);
}

export function getProductCommissionAmount(p: Product): number {
  return getProductOperation(p) * ((p.agentCommissionPercent || 0) / 100.0);
}

export function getProductOperationWithCommission(p: Product): number {
  return getProductOperation(p) + getProductCommissionAmount(p);
}

export function getProductEfectivo(p: Product): number {
  return p.reduce || 0;
}

export function getProductSaldoCalculado(p: Product): number {
  const bill = p.taxes?.bill || { neto: 0, iva: 0, ganancias: 0 };
  return getProductOperation(p) - getProductEfectivo(p) - (bill.iva || 0) - (bill.ganancias || 0);
}

export function getProductTotalFinalOperation(p: Product): number {
  const iva = p.taxes?.bill?.iva || 0;
  return Math.max(0.0, getProductSaldoCalculado(p) + iva);
}

export function getProductAvgKg(p: Product): number {
  return p.quantity > 0 ? (p.kg || 0) / p.quantity : 0.0;
}

export function getProductAvgKgClean(p: Product): number {
  return p.quantity > 0 ? getProductKgClean(p) / p.quantity : 0.0;
}

export function getProductFactura(p: Product): number {
  return Math.max(0.0, getProductOperation(p) - (p.reduce || 0));
}

export function getProductYield(p: Product): number {
  const clean = getProductKgClean(p);
  return clean > 0 ? (p.kgFaena || 0) / clean : 0.0;
}

export function getProductFacturaOverOperationPercent(p: Product): number {
  const op = getProductOperation(p);
  if (op <= 0) return 0;
  return getBillFactura(p.taxes?.bill || { neto: 0, iva: 0, ganancias: 0 }) / op;
}

export function hasProductFacturaWarning(p: Product): boolean {
  const pct = getProductFacturaOverOperationPercent(p);
  return pct < 0.5 || pct > 1.0;
}

// Producer computed
export function getProducerTotalQuantity(prod: Producer): number {
  return (prod.listOfProducts || []).reduce((acc, p) => acc + (p.quantity || 0), 0);
}

export function getProducerTotalKgClean(prod: Producer): number {
  return (prod.listOfProducts || []).reduce((acc, p) => acc + getProductKgClean(p), 0);
}

export function getProducerTotalKgFaena(prod: Producer): number {
  return (prod.listOfProducts || []).reduce((acc, p) => acc + (p.kgFaena || 0), 0);
}

export function getProducerTotalOperation(prod: Producer): number {
  return (prod.listOfProducts || []).reduce((acc, p) => acc + getProductOperation(p), 0);
}

export function getProducerTotalOperationWithCommission(prod: Producer): number {
  return (prod.listOfProducts || []).reduce((acc, p) => acc + getProductOperationWithCommission(p), 0);
}

export function getProducerTotalReduce(prod: Producer): number {
  return (prod.listOfProducts || []).reduce((acc, p) => acc + (p.reduce || 0), 0);
}

export function getProducerAvgPrice(prod: Producer): number {
  const clean = getProducerTotalKgClean(prod);
  return clean > 0 ? getProducerTotalOperation(prod) / clean : 0;
}

export function getProducerGeneralYield(prod: Producer): number {
  const clean = getProducerTotalKgClean(prod);
  return clean > 0 ? getProducerTotalKgFaena(prod) / clean : 0;
}

// Buy computed
export function getBuyTotalOperation(buy: Buy): number {
  return (buy.listOfProducers || []).reduce((acc, p) => acc + getProducerTotalOperation(p), 0);
}

export function getBuyAgentCommissionAmount(buy: Buy): number {
  return getBuyTotalOperation(buy) * ((buy.agent?.percent ?? 0) / 100.0);
}

export function getBuyReductionForProducts(buy: Buy): number {
  if ((buy.totalReduce || 0) <= 0) return 0;
  return Math.max(0.0, buy.totalReduce - getBuyAgentCommissionAmount(buy));
}

export function getBuyTotalOperationWithReduce(buy: Buy): number {
  return getBuyTotalOperation(buy) - getBuyReductionForProducts(buy);
}

export function getBuyTotalOperationWithCommission(buy: Buy): number {
  return getBuyTotalOperation(buy) + getBuyAgentCommissionAmount(buy);
}

export function getBuyTotalToPayToProducers(buy: Buy): number {
  return (buy.listOfProducers || []).reduce(
    (acc, prod) => acc + (prod.listOfProducts || []).reduce((s, p) => s + getProductTotalFinalOperation(p), 0),
    0
  );
}

export function getBuyTotalQuantity(buy: Buy): number {
  return (buy.listOfProducers || []).reduce((acc, p) => acc + getProducerTotalQuantity(p), 0);
}

export function getBuyTotalKgClean(buy: Buy): number {
  return (buy.listOfProducers || []).reduce((acc, p) => acc + getProducerTotalKgClean(p), 0);
}

export function getBuyAvgPrice(buy: Buy): number {
  const clean = getBuyTotalKgClean(buy);
  return clean > 0 ? getBuyTotalOperation(buy) / clean : 0;
}

export function getBuyAvgPriceWithCommission(buy: Buy): number {
  const clean = getBuyTotalKgClean(buy);
  return clean > 0 ? getBuyTotalOperationWithCommission(buy) / clean : 0;
}

export function getBuyTotalKgFaena(buy: Buy): number {
  return (buy.listOfProducers || []).reduce((acc, p) => acc + getProducerTotalKgFaena(p), 0);
}

export function getBuyGeneralYield(buy: Buy): number {
  const clean = getBuyTotalKgClean(buy);
  return clean > 0 ? getBuyTotalKgFaena(buy) / clean : 0;
}

export function getBuyFacturaOverOperationPercent(buy: Buy): number {
  const totalOp = getBuyTotalOperation(buy);
  if (totalOp <= 0) return 0;
  const totalFact = (buy.listOfProducers || []).reduce(
    (acc, prod) => acc + (prod.listOfProducts || []).reduce((s, p) => s + getBillFactura(p.taxes?.bill || { neto: 0, iva: 0, ganancias: 0 }), 0),
    0
  );
  return totalFact / totalOp;
}

export function hasBuyFacturaWarning(buy: Buy): boolean {
  const pct = getBuyFacturaOverOperationPercent(buy);
  return pct < 0.5 || pct > 1.0;
}

export function applyAgentContextToBuy(buy: Buy): Buy {
  const percent = buy.agent?.percent ?? 0;
  return {
    ...buy,
    listOfProducers: (buy.listOfProducers || []).map((prod) => ({
      ...prod,
      listOfProducts: (prod.listOfProducts || []).map((p) => ({
        ...p,
        agentCommissionPercent: percent,
      })),
    })),
  };
}

// Travel computed
export function getTravelStatusDisplayName(status: TravelStatus): string {
  switch (status) {
    case 'DRAFT': return 'Borrador';
    case 'ACTIVE': return 'Activo / Hacienda';
    case 'FLETE': return 'Solo Flete';
  }
}

export function getDistanceKm(t: Travel): number {
  return Math.max(0.0, (t.kmOnDestination || 0) - (t.kmOnOrigin || 0));
}

export function getDriverCost(t: Travel): number {
  const isDouble = t.truck?.trailer?.type === 'DOUBLE';
  const rate = isDouble ? (t.driverPricePerKmDouble || 0) : (t.driverPricePerKmSimple || 0);
  return getDistanceKm(t) * rate;
}

export function getStartFee(t: Travel, config: AppConfig = createDefaultConfig()): number {
  const isDouble = t.truck?.trailer?.type === 'DOUBLE';
  const snapshotFee = isDouble ? (t.freightStartFeeDoubleSnapshot || 0) : (t.freightStartFeeSimpleSnapshot || 0);

  if (snapshotFee > 0 && snapshotFee !== 5000.0 && snapshotFee !== 8000.0) {
    return snapshotFee;
  }

  const configFee = isDouble ? config.freightStartFeeDouble : config.freightStartFeeSimple;
  if (configFee > 0) return configFee;
  if (snapshotFee > 0) return snapshotFee;
  return isDouble ? 8000.0 : 5000.0;
}

export function getEffectiveFreightPricePerKm(t: Travel, config: AppConfig = createDefaultConfig()): number {
  if (t.isOnlyFreight) {
    const isDouble = t.truck?.trailer?.type === 'DOUBLE';
    const snapPrice = isDouble ? (t.freightPriceDoubleSnapshot || 0) : (t.freightPriceSimpleSnapshot || 0);
    if ((t.pricePerKm || 0) > 0) return t.pricePerKm;
    if (snapPrice > 0 && snapPrice !== 100.0 && snapPrice !== 150.0) return snapPrice;
    const configPrice = isDouble ? config.freightPriceDouble : config.freightPriceSimple;
    if (configPrice > 0) return configPrice;
    if (snapPrice > 0) return snapPrice;
    return isDouble ? 150.0 : 100.0;
  }
  return t.pricePerKm || 0;
}

export function getFleteCost(t: Travel, config: AppConfig = createDefaultConfig()): number {
  const dist = getDistanceKm(t);
  if (dist <= 0) return 0;
  const base = dist * getEffectiveFreightPricePerKm(t, config);
  const start = dist < 300.0 ? getStartFee(t, config) : 0.0;
  return base + start;
}

export function getFleteCalculationDetail(t: Travel, config: AppConfig = createDefaultConfig()): string {
  const dist = getDistanceKm(t);
  if (dist <= 0) return '0 km';
  const rate = getEffectiveFreightPricePerKm(t, config);
  const detail = `${Formatters.decimal(dist, 0)} km * ${Formatters.currency(rate)}/km`;
  if (dist < 300.0) {
    return `${detail} + ${Formatters.currency(getStartFee(t, config))} (Arranque)`;
  }
  return detail;
}

export function getFuelCost(t: Travel): number {
  const dist = getDistanceKm(t);
  const eff = t.truck?.averageEfficiency || 0;
  if (eff > 0) {
    return (2.0 * dist * (t.fuelPrice || 0)) / eff;
  }
  return (t.litersOnPump || 0) * (t.fuelPrice || 0);
}

export function getTruckFreightCost(t: Travel): number {
  if (t.truck?.isFreightPaid) {
    const price = t.truck?.trailer?.type === 'DOUBLE' ? t.simulationFreightPriceDouble : t.simulationFreightPriceSimple;
    return getDistanceKm(t) * (price || 0);
  }
  return 0;
}

export function getGastosDelViaje(t: Travel): number {
  return (t.expenses || []).reduce((acc, e) => acc + (e.amount || 0), 0);
}

export function getReimbursableExpenses(t: Travel): number {
  return (t.expenses || []).filter((e) => e.isReimbursable).reduce((acc, e) => acc + (e.amount || 0), 0);
}

export function getTravelProfit(t: Travel, config: AppConfig = createDefaultConfig()): number {
  return getFleteCost(t, config) - getDriverCost(t) - getFuelCost(t) - getGastosDelViaje(t);
}

export function getActualKgFaena(t: Travel): number {
  if ((t.kgFaenaTotal || 0) > 0) return t.kgFaenaTotal;
  return Math.max(getBuyTotalKgFaena(t.buy), t.buy?.kgFaenaGlobal || 0);
}

export function getTravelYield(t: Travel): number {
  const clean = getBuyTotalKgClean(t.buy);
  return clean > 0 ? getActualKgFaena(t) / clean : 0.0;
}

export function hasTravelYieldCorrection(t: Travel): boolean {
  return (t.yieldCorrectionAmount || 0) !== 0 || (t.yieldCorrectionKg || 0) !== 0;
}

export function getEffectiveYield(t: Travel): number {
  if (!hasTravelYieldCorrection(t)) return getTravelYield(t);
  const adjustedClean = getBuyTotalKgClean(t.buy) + (t.yieldCorrectionKg || 0);
  return adjustedClean > 0 ? getActualKgFaena(t) / adjustedClean : 0.0;
}

export function getInitialCostPerKg(t: Travel): number {
  const actual = getActualKgFaena(t);
  if (actual <= 0) return 0;
  const baseTotal = getBuyTotalKgClean(t.buy) * getBuyAvgPriceWithCommission(t.buy);
  const adjustedTotal = baseTotal + (t.yieldCorrectionAmount || 0);
  return adjustedTotal / actual;
}

export function getTransportCostPerKg(t: Travel, config: AppConfig = createDefaultConfig()): number {
  const actual = getActualKgFaena(t);
  return actual > 0 ? getFleteCost(t, config) / actual : 0.0;
}

export function getFinalCostPerKg(t: Travel, config: AppConfig = createDefaultConfig()): number {
  const actual = getActualKgFaena(t);
  if (actual <= 0) return 0;
  const totalGanancias = (t.buy?.listOfProducers || []).reduce(
    (acc, prod) => acc + (prod.listOfProducts || []).reduce((s, p) => s + (p.taxes?.bill?.ganancias || 0), 0),
    0
  );
  const taxesCostPerKg = (totalGanancias * (t.coefImposturesSobreLaVenta || 1.0)) / actual;
  const rawCost = getInitialCostPerKg(t) + getTransportCostPerKg(t, config) + taxesCostPerKg;
  return Math.round(rawCost * 100) / 100.0;
}

export function calculateTravelFuelEfficiency(t: Travel, previousKmOnPump: number): number {
  if ((t.litersOnPump || 0) <= 0) return 0;
  const diff = (t.kmOnPump || 0) - previousKmOnPump;
  return diff > 0 ? diff / t.litersOnPump : 0;
}

export function getTravelDisplayTitle(t: Travel): string {
  const cleanDesc = (t.description || '').trim();
  if (cleanDesc) return cleanDesc;

  if (t.isOnlyFreight) {
    const agentName = (t.buy?.agent?.name || '').trim();
    if (agentName) return `Flete - ${agentName}`;
    return 'Solo Flete';
  }

  const producers = t.buy?.listOfProducers || [];
  if (producers.length > 0 && producers[0].name) {
    if (producers.length > 1) {
      return `${producers[0].name} (+${producers.length - 1})`;
    }
    return producers[0].name;
  }

  if (t.truck?.driver?.name) {
    return `${t.truck.driver.name} - ${Formatters.displayDate(t.date)}`;
  }

  if (t.truck?.name) {
    return `${t.truck.name} - ${Formatters.displayDate(t.date)}`;
  }

  return `Viaje ${Formatters.displayDate(t.date)}`;
}

export function getProducerNamesDisplay(t: Travel): string {
  const names = (t.buy?.listOfProducers || [])
    .map((p) => (p.name || '').trim())
    .filter(Boolean);
  return names.length > 0 ? names.join(', ') : 'Sin productor';
}

export function getSubtitleDetail(t: Travel): string {
  const parts: string[] = [];
  if (t.truck?.driver?.name) parts.push(t.truck.driver.name);
  if (t.truck?.licensePlate) parts.push(t.truck.licensePlate);
  const dist = getDistanceKm(t);
  if (dist > 0) parts.push(`${Formatters.decimal(dist, 0)} km`);
  return parts.join(' • ');
}

// MARK: - Document Expiration Checks (< 15 days)

export interface DocumentExpirationAlert {
  entityName: string;
  entityType: 'CAMIÓN' | 'JAULA';
  documentName: 'VTV' | 'Seguro' | 'SENASA';
  expirationDate: string;
  daysRemaining: number;
}

function diffDaysFromNow(dateStr: string): number | null {
  const dt = Formatters.parseDate(dateStr);
  if (!dt) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isTrailerExpiring(trailer: Trailer, thresholdDays = 15): boolean {
  const vtvDays = diffDaysFromNow(trailer.vtvExpiration);
  if (vtvDays !== null && vtvDays <= thresholdDays) return true;
  const senasaDays = diffDaysFromNow(trailer.senasaExpiration);
  if (senasaDays !== null && senasaDays <= thresholdDays) return true;
  return false;
}

export function hasTruckExpiringDocuments(truck: Truck, thresholdDays = 15): boolean {
  const vtvDays = diffDaysFromNow(truck.vtvExpiration);
  if (vtvDays !== null && vtvDays <= thresholdDays) return true;
  const insDays = diffDaysFromNow(truck.insuranceExpiration);
  if (insDays !== null && insDays <= thresholdDays) return true;
  return truck.trailer ? isTrailerExpiring(truck.trailer, thresholdDays) : false;
}

export function getExpiringDocumentsAlertList(
  trucks: Truck[],
  trailers: Trailer[],
  thresholdDays = 15
): DocumentExpirationAlert[] {
  const alerts: DocumentExpirationAlert[] = [];

  for (const t of trucks) {
    const vtv = diffDaysFromNow(t.vtvExpiration);
    if (vtv !== null && vtv <= thresholdDays) {
      alerts.push({
        entityName: t.name || t.licensePlate || 'Camión',
        entityType: 'CAMIÓN',
        documentName: 'VTV',
        expirationDate: t.vtvExpiration,
        daysRemaining: vtv,
      });
    }
    const ins = diffDaysFromNow(t.insuranceExpiration);
    if (ins !== null && ins <= thresholdDays) {
      alerts.push({
        entityName: t.name || t.licensePlate || 'Camión',
        entityType: 'CAMIÓN',
        documentName: 'Seguro',
        expirationDate: t.insuranceExpiration,
        daysRemaining: ins,
      });
    }
  }

  for (const tr of trailers) {
    const vtv = diffDaysFromNow(tr.vtvExpiration);
    if (vtv !== null && vtv <= thresholdDays) {
      alerts.push({
        entityName: tr.name || tr.licensePlate || 'Jaula',
        entityType: 'JAULA',
        documentName: 'VTV',
        expirationDate: tr.vtvExpiration,
        daysRemaining: vtv,
      });
    }
    const senasa = diffDaysFromNow(tr.senasaExpiration);
    if (senasa !== null && senasa <= thresholdDays) {
      alerts.push({
        entityName: tr.name || tr.licensePlate || 'Jaula',
        entityType: 'JAULA',
        documentName: 'SENASA',
        expirationDate: tr.senasaExpiration,
        daysRemaining: senasa,
      });
    }
  }

  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
