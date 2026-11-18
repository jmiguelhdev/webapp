import Dexie, { Table } from 'dexie';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
} from 'firebase/firestore';
import {
  Agent,
  AgentPayment,
  AppConfig,
  Buy,
  Driver,
  Expense,
  Producer,
  Product,
  SyncStatus,
  Trailer,
  TrailerType,
  Travel,
  TravelStatus,
  Truck,
  createBill,
  createBuy,
  createDefaultConfig,
  createDriver,
  createProducer,
  createProduct,
  createTrailer,
  createTravel,
  createTruck,
} from '../domain/models';
import { OdometerOCRScanner, TravelCalculator } from '../domain/engine';

// =============================================================================
// 1. Firebase Initialization (Shared project: kmppampalogs)
// =============================================================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
// Usamos caché en memoria para Firestore SDK en /fletes/ para no colisionar con el bloqueo
// IndexedDB single-tab de webApp (/) en el mismo origen. Dexie (iosfletes_pwa_db) provee el modo offline.
export const db: Firestore = getFirestore(firebaseApp);

// =============================================================================
// 2. Dexie Local IndexedDB (Offline-First Store)
// =============================================================================

class FletesDatabase extends Dexie {
  travels!: Table<Travel, number>;
  trucks!: Table<Truck, number>;
  trailers!: Table<Trailer, number>;
  drivers!: Table<Driver, number>;
  producers!: Table<Producer, number>;
  agents!: Table<Agent, number>;
  agentPayments!: Table<AgentPayment, number>;
  config!: Table<AppConfig, string>;

  constructor() {
    super('iosfletes_pwa_db');
    this.version(1).stores({
      travels: 'id, date, status, updatedAt, isDirty',
      trucks: 'id, name, licensePlate, updatedAt',
      trailers: 'id, name, licensePlate',
      drivers: 'id, name, dni',
      producers: 'id, name, cuit',
      agents: 'id, name',
      agentPayments: 'id, agentId, date, updatedAt',
      config: 'id',
    });
  }
}

export const localDb = new FletesDatabase();

// =============================================================================
// 3. Dummy Data Guards & Normalization Helpers (Parity with Swift)
// =============================================================================

export function isDummyDriver(d: Driver): boolean {
  const name = (d.name || '').trim().toLowerCase();
  return (
    name.includes('carlos maidana') ||
    name.includes('esteban g') ||
    d.dni === '32456789' ||
    d.dni === '29876543'
  );
}

export function isDummyTruck(t: Truck): boolean {
  const name = (t.name || '').toLowerCase();
  return (
    name === 'scania r450' ||
    name === 'mercedes-benz actros' ||
    t.licensePlate === 'AF 123 CD' ||
    t.licensePlate === 'AG 890 ZX' ||
    t.id === 1 ||
    t.id === 2
  );
}

export function isDummyTrailer(t: Trailer): boolean {
  const name = (t.name || '').toLowerCase();
  return (
    name.includes('jaula pampa') ||
    t.licensePlate === 'AD 450 BB' ||
    t.licensePlate === 'AE 112 CC' ||
    (t.id <= 2 && (t.licensePlate || '').startsWith('A'))
  );
}

export function isDummyProducer(p: Producer): boolean {
  const name = (p.name || '').toLowerCase();
  return (
    name.includes('san jorge') ||
    name.includes('los pinos') ||
    p.cuit === '30-70894561-4' ||
    p.cuit === '30-65432190-8'
  );
}

export function isDummyAgent(a: Agent): boolean {
  return (a.name || '').toLowerCase().includes('pampeana');
}

function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

export function toNumId(val: unknown, fallbackKey?: string): number {
  if (typeof val === 'number' && Number.isFinite(val) && val !== 0) {
    return Math.trunc(val);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed) {
      if (/^\d+$/.test(trimmed)) {
        const n = Number(trimmed);
        if (Number.isFinite(n) && n !== 0) return Math.trunc(n);
      }
      const prefixMatch = /^[A-Z_]+_(\d+)$/i.exec(trimmed);
      if (prefixMatch) {
        const n = Number(prefixMatch[1]);
        if (Number.isFinite(n) && n !== 0) return Math.trunc(n);
      }
      return hashStringToInt(trimmed);
    }
  }
  if (fallbackKey && fallbackKey.trim()) {
    return toNumId(fallbackKey);
  }
  return 0;
}

function toNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const parsed = OdometerOCRScanner.parseNumber(val);
    if (parsed !== null && Number.isFinite(parsed)) return parsed;
    const direct = Number(val);
    if (Number.isFinite(direct)) return direct;
  }
  return fallback;
}

export function normalizeDriver(raw: Record<string, unknown>, docId?: string): Driver {
  const name = String(raw.name ?? '');
  const id = toNumId(raw.id, docId || name);
  return createDriver({
    id,
    name,
    dni: String(raw.dni ?? ''),
    license: String(raw.license ?? raw.phone ?? ''),
  });
}

export function normalizeTrailer(raw: Record<string, unknown>, docId?: string): Trailer {
  const typeStr = String(raw.type ?? 'SIMPLE').toUpperCase();
  const type: TrailerType = typeStr === 'DOUBLE' ? 'DOUBLE' : 'SIMPLE';
  const name = String(raw.name ?? '');
  const id = toNumId(raw.id, docId || `${name}_${raw.licensePlate ?? ''}`);
  return createTrailer({
    id,
    name,
    licensePlate: String(raw.licensePlate ?? ''),
    vtvExpiration: String(raw.vtvExpiration ?? ''),
    senasaExpiration: String(raw.senasaExpiration ?? ''),
    type,
  });
}

export function normalizeTruck(
  raw: Record<string, unknown>,
  drivers: Driver[] = [],
  trailers: Trailer[] = [],
  docId?: string
): Truck {
  const rawDriver = (raw.driver && typeof raw.driver === 'object' ? raw.driver : {}) as Record<string, unknown>;
  const rawTrailer = (raw.trailer && typeof raw.trailer === 'object' ? raw.trailer : {}) as Record<string, unknown>;

  const dId =
    toNumId(raw.driverId) ||
    toNumId(rawDriver.id) ||
    (typeof raw.driver === 'string' || typeof raw.driver === 'number' ? toNumId(raw.driver) : 0);
  const foundDriver = dId ? drivers.find((d) => d.id === dId && !isDummyDriver(d)) : undefined;
  const driver: Driver =
    foundDriver ||
    (rawDriver.name && !isDummyDriver(normalizeDriver(rawDriver))
      ? normalizeDriver(rawDriver)
      : createDriver({ id: dId, name: 'Sin Chofer Asignado' }));

  const tId =
    toNumId(raw.trailerId) ||
    toNumId(rawTrailer.id) ||
    (typeof raw.trailer === 'string' || typeof raw.trailer === 'number' ? toNumId(raw.trailer) : 0);
  const foundTrailer = tId ? trailers.find((t) => t.id === tId && !isDummyTrailer(t)) : undefined;
  const trailer: Trailer =
    foundTrailer ||
    (rawTrailer.name && !isDummyTrailer(normalizeTrailer(rawTrailer))
      ? normalizeTrailer(rawTrailer)
      : createTrailer({ id: tId, name: 'Sin Jaula Asignada', type: 'SIMPLE' }));

  const truckId = toNumId(raw.id, docId || `${raw.name ?? ''}_${raw.licensePlate ?? ''}`);
  return createTruck({
    id: truckId,
    name: String(raw.name ?? `Camión #${truckId}`),
    licensePlate: String(raw.licensePlate ?? ''),
    vtvExpiration: String(raw.vtvExpiration ?? ''),
    insuranceExpiration: String(raw.insuranceExpiration ?? ''),
    driver,
    trailer,
    averageEfficiency: toNum(raw.averageEfficiency, 0),
    isFreightPaid: Boolean(raw.isFreightPaid),
    updatedAt: toNum(raw.updatedAt, 0),
    isDirty: false,
    isDeleted: false,
  });
}

function normalizeProduct(raw: Record<string, unknown>, fallbackIdx = 0): Product {
  const taxesRaw = (raw.taxes && typeof raw.taxes === 'object' ? raw.taxes : {}) as Record<string, unknown>;
  const billRaw = (taxesRaw.bill && typeof taxesRaw.bill === 'object' ? taxesRaw.bill : {}) as Record<string, unknown>;

  const rawRoughing = toNum(raw.roughing, 3.0);
  const roughing = rawRoughing > 0 && rawRoughing < 1 ? (1 - rawRoughing) * 100 : rawRoughing;

  return createProduct({
    id: toNumId(raw.id, `${raw.name ?? 'prod'}_${fallbackIdx}_${raw.kg ?? 0}`) || Date.now() + fallbackIdx,
    name: String(raw.name ?? ''),
    quantity: Math.trunc(toNum(raw.quantity, 0)),
    kg: toNum(raw.kg, 0),
    roughing,
    price: toNum(raw.price, 0),
    total: toNum(raw.total, 0),
    reduce: toNum(raw.reduce, 0),
    taxes: {
      id: toNumId(taxesRaw.id) || Date.now() + fallbackIdx,
      date: String(taxesRaw.date ?? ''),
      bill: createBill({
        neto: toNum(billRaw.neto, 0),
        iva: toNum(billRaw.iva, 0),
        ganancias: toNum(billRaw.ganancias, 0),
      }),
    },
    kgFaena: toNum(raw.kgFaena, 0),
    isKgFaenaProrated: Boolean(raw.isKgFaenaProrated),
    isIvaManual: Boolean(raw.isIvaManual),
    agentCommissionPercent: toNum(raw.agentCommissionPercent, 0),
  });
}

function normalizeProducer(raw: Record<string, unknown>, includeProducts = true, docId?: string): Producer {
  const nested =
    raw.producer && typeof raw.producer === 'object' ? (raw.producer as Record<string, unknown>) : null;
  const name = String(nested?.name ?? raw.name ?? raw.nombre ?? raw.razonSocial ?? raw.producerName ?? '');
  const phone = String(nested?.phone ?? raw.phone ?? raw.telefono ?? '');
  const cuit = String(nested?.cuit ?? raw.cuit ?? raw.cuit_numero ?? '');
  const cbu = String(nested?.cbu ?? raw.cbu ?? raw.cbu_numero ?? '');
  const id = toNumId(raw.id ?? nested?.id, docId || `${name}_${cuit}`);
  const productsRaw = Array.isArray(raw.listOfProducts) ? raw.listOfProducts : [];

  return createProducer({
    id,
    name,
    phone,
    cuit,
    cbu,
    usageCount: Math.trunc(toNum(raw.usageCount, 0)),
    listOfProducts: includeProducts
      ? productsRaw.map((p, idx) => normalizeProduct((p || {}) as Record<string, unknown>, idx))
      : [],
  });
}

function normalizeAgent(raw: Record<string, unknown>, docId?: string): Agent {
  const name = String(raw.name ?? '');
  return createAgent({
    id: toNumId(raw.id, docId || name),
    name,
    phone: String(raw.phone ?? ''),
    percent: toNum(raw.percent, 0),
    usageCount: Math.trunc(toNum(raw.usageCount, 0)),
  });
}

function normalizeExpense(raw: Record<string, unknown>, fallbackTravelId: number): Expense {
  return {
    id: toNumId(raw.id) || Date.now(),
    travelId: toNumId(raw.travelId) || fallbackTravelId,
    description: String(raw.description ?? ''),
    amount: toNum(raw.amount, 0),
    category: String(raw.category ?? 'Peajes'),
    date: String(raw.date ?? ''),
    isReimbursable: raw.isReimbursable !== undefined ? Boolean(raw.isReimbursable) : true,
  };
}

export function normalizeTravelFromDoc(
  docData: Record<string, unknown>,
  docId: string,
  config: AppConfig
): Travel | null {
  let merged: Record<string, unknown> = { ...docData };

  if (typeof docData.data === 'string' && docData.data.trim()) {
    try {
      const parsed = JSON.parse(docData.data) as Record<string, unknown>;
      merged = { ...docData, ...parsed };
    } catch {
      // Fall back to structured map fields
    }
  }

  const numericId = toNumId(merged.id) || toNumId(docId);
  if (!numericId) return null;

  const statusRaw = String(merged.status ?? 'DRAFT').toUpperCase();
  const status: TravelStatus =
    statusRaw === 'FLETE'
      ? 'FLETE'
      : statusRaw === 'ACTIVE' || statusRaw === 'ACTIVO' || statusRaw === 'COMPLETED' || statusRaw === 'FINALIZADO'
      ? 'ACTIVE'
      : 'DRAFT';

  const truckRaw = (merged.truck && typeof merged.truck === 'object' ? merged.truck : {}) as Record<string, unknown>;
  const truck = normalizeTruck(truckRaw);

  const buyRaw = (merged.buy && typeof merged.buy === 'object' ? merged.buy : {}) as Record<string, unknown>;
  const rawProducers = Array.isArray(buyRaw.listOfProducers) ? buyRaw.listOfProducers : [];
  const rawAgent = buyRaw.agent && typeof buyRaw.agent === 'object' ? (buyRaw.agent as Record<string, unknown>) : null;

  const buy: Buy = createBuy({
    id: toNumId(buyRaw.id) || numericId,
    date: String(buyRaw.date ?? merged.date ?? ''),
    truckId: toNumId(buyRaw.truckId) || truck.id,
    listOfProducers: rawProducers.map((p, idx) =>
      normalizeProducer((p || {}) as Record<string, unknown>, true, `prod_${numericId}_${idx}`)
    ),
    agent: rawAgent && rawAgent.name ? normalizeAgent(rawAgent) : null,
    totalReduce: toNum(buyRaw.totalReduce ?? buyRaw.reduce ?? merged.reduce, 0),
    reducePercent: buyRaw.reducePercent !== undefined && buyRaw.reducePercent !== null ? toNum(buyRaw.reducePercent, 0) : null,
    kgFaenaGlobal: toNum(buyRaw.kgFaenaGlobal, 0),
  });

  const expensesRaw = Array.isArray(merged.expenses) ? merged.expenses : [];
  const expenses = expensesRaw.map((e) => normalizeExpense((e || {}) as Record<string, unknown>, numericId));

  const base = createTravel(config, {
    id: numericId,
    rawDocId: docId,
    status,
    truck,
    kmOnOrigin: toNum(merged.kmOnOrigin, 0),
    kmOnDestination: toNum(merged.kmOnDestination, 0),
    kmOnPump: toNum(merged.kmOnPump, 0),
    litersOnPump: toNum(merged.litersOnPump, 0),
    date: String(merged.date ?? ''),
    description: String(merged.description ?? ''),
    pricePerKm: toNum(merged.pricePerKm, config.defaultFreightPricePerKm),
    driverPricePerKmSimple: toNum(merged.driverPricePerKmSimple, config.defaultDriverPricePerKmSimple),
    driverPricePerKmDouble: toNum(merged.driverPricePerKmDouble, config.defaultDriverPricePerKmDouble),
    fuelPrice: toNum(merged.fuelPrice, config.fuelPrice),
    simulationFreightPriceSimple: toNum(merged.simulationFreightPriceSimple, config.simulationFreightPriceSimple),
    simulationFreightPriceDouble: toNum(merged.simulationFreightPriceDouble, config.simulationFreightPriceDouble),
    buy,
    kgFaenaTotal: toNum(merged.kgFaenaTotal, 0),
    coefImposturesSobreLaVenta: toNum(merged.coefImposturesSobreLaVenta, 1.0),
    yieldCorrectionKg: toNum(merged.yieldCorrectionKg, 0),
    yieldCorrectionAmount: toNum(merged.yieldCorrectionAmount, 0),
    isOnlyFreight: Boolean(merged.isOnlyFreight || status === 'FLETE'),
    freightPriceSimpleSnapshot: toNum(merged.freightPriceSimpleSnapshot, config.freightPriceSimple),
    freightStartFeeSimpleSnapshot: toNum(merged.freightStartFeeSimpleSnapshot, config.freightStartFeeSimple),
    freightPriceDoubleSnapshot: toNum(merged.freightPriceDoubleSnapshot, config.freightPriceDouble),
    freightStartFeeDoubleSnapshot: toNum(merged.freightStartFeeDoubleSnapshot, config.freightStartFeeDouble),
    expenses,
    updatedAt: toNum(docData.updatedAt ?? merged.updatedAt, Date.now()),
    isDirty: false,
  });

  return base;
}

export function travelToFirestoreDict(travel: Travel, userId: string, timestamp: number): Record<string, unknown> {
  const t = travel.truck;
  const b = travel.buy;

  const cleanTravelCopy: Travel = {
    ...travel,
    isDirty: false,
    updatedAt: timestamp,
  };

  const buyDict: Record<string, unknown> = {
    id: String(b.id),
    date: b.date,
    truckId: String(b.truckId > 0 ? b.truckId : t.id),
    totalReduce: b.totalReduce,
    kgFaenaGlobal: b.kgFaenaGlobal,
    listOfProducers: (b.listOfProducers || []).map((prod) => ({
      id: String(prod.id),
      name: prod.name,
      phone: prod.phone,
      cuit: prod.cuit,
      cbu: prod.cbu,
      usageCount: prod.usageCount,
      listOfProducts: (prod.listOfProducts || []).map((p) => ({
        id: String(p.id),
        name: p.name,
        quantity: p.quantity,
        kg: p.kg,
        roughing: p.roughing,
        price: p.price,
        total: p.total,
        reduce: p.reduce,
        taxes: {
          id: String(p.taxes.id),
          date: p.taxes.date,
          bill: {
            neto: p.taxes.bill.neto,
            iva: p.taxes.bill.iva,
            ganancias: p.taxes.bill.ganancias,
          },
        },
        kgFaena: p.kgFaena,
        isKgFaenaProrated: p.isKgFaenaProrated,
        isIvaManual: p.isIvaManual,
        agentCommissionPercent: p.agentCommissionPercent,
      })),
    })),
  };

  if (b.reducePercent !== null && b.reducePercent !== undefined) {
    buyDict.reducePercent = b.reducePercent;
  }
  if (b.agent) {
    buyDict.agent = {
      id: String(b.agent.id),
      name: b.agent.name,
      phone: b.agent.phone,
      percent: b.agent.percent,
      usageCount: b.agent.usageCount,
    };
  }

  return {
    id: String(travel.id),
    status: travel.status,
    kmOnOrigin: travel.kmOnOrigin,
    kmOnDestination: travel.kmOnDestination,
    kmOnPump: travel.kmOnPump,
    litersOnPump: travel.litersOnPump,
    date: travel.date,
    description: travel.description,
    pricePerKm: travel.pricePerKm,
    driverPricePerKmSimple: travel.driverPricePerKmSimple,
    driverPricePerKmDouble: travel.driverPricePerKmDouble,
    fuelPrice: travel.fuelPrice,
    simulationFreightPriceSimple: travel.simulationFreightPriceSimple,
    simulationFreightPriceDouble: travel.simulationFreightPriceDouble,
    kgFaenaTotal: travel.kgFaenaTotal,
    coefImposturesSobreLaVenta: travel.coefImposturesSobreLaVenta,
    yieldCorrectionKg: travel.yieldCorrectionKg,
    yieldCorrectionAmount: travel.yieldCorrectionAmount,
    isOnlyFreight: travel.isOnlyFreight,
    freightPriceSimpleSnapshot: travel.freightPriceSimpleSnapshot,
    freightStartFeeSimpleSnapshot: travel.freightStartFeeSimpleSnapshot,
    freightPriceDoubleSnapshot: travel.freightPriceDoubleSnapshot,
    freightStartFeeDoubleSnapshot: travel.freightStartFeeDoubleSnapshot,
    updatedAt: timestamp,
    userId,
    truck: {
      id: String(t.id),
      name: t.name,
      licensePlate: t.licensePlate,
      vtvExpiration: t.vtvExpiration,
      insuranceExpiration: t.insuranceExpiration,
      averageEfficiency: t.averageEfficiency,
      isFreightPaid: t.isFreightPaid,
      updatedAt: t.updatedAt,
      driver: {
        id: String(t.driver.id),
        name: t.driver.name,
        dni: t.driver.dni,
        license: t.driver.license,
      },
      trailer: {
        id: String(t.trailer.id),
        name: t.trailer.name,
        licensePlate: t.trailer.licensePlate,
        vtvExpiration: t.trailer.vtvExpiration,
        senasaExpiration: t.trailer.senasaExpiration,
        type: t.trailer.type,
      },
    },
    buy: buyDict,
    expenses: (travel.expenses || []).map((exp) => ({
      id: String(exp.id),
      travelId: String(travel.id),
      description: exp.description,
      amount: exp.amount,
      category: exp.category,
      date: exp.date,
      isReimbursable: exp.isReimbursable,
    })),
    data: JSON.stringify(cleanTravelCopy),
  };
}

// =============================================================================
// 4. Sync & Store State Manager (Observable Store for React)
// =============================================================================

export interface SyncResult {
  ok: boolean;
  travelsCount: number;
  trucksCount: number;
  producersCount: number;
  error?: string;
}

export interface StoreSnapshot {
  travels: Travel[];
  trucks: Truck[];
  trailers: Trailer[];
  drivers: Driver[];
  producers: Producer[];
  agents: Agent[];
  agentPayments: AgentPayment[];
  config: AppConfig;
  syncStatus: SyncStatus;
  lastSyncTime: number | null;
  lastSyncError: string | null;
  user: User | null;
  authLoading: boolean;
  isSyncing: boolean;
  isLoaded: boolean;
  sharedCompanyMode: boolean;
}

const LAST_MASTER_TS_KEY = 'iosfletes_last_master_ts';
const LAST_TRAVELS_TS_KEY = 'iosfletes_last_travels_ts';
const SHARED_COMPANY_MODE_KEY = 'iosfletes_shared_company_mode';

type Listener = () => void;

class PersistenceStore {
  private listeners = new Set<Listener>();
  private isSyncInProgress = false;
  private lastSyncSuccessAt = 0;
  private readonly cooldownMs = 15_000;

  private state: StoreSnapshot = {
    travels: [],
    trucks: [],
    trailers: [],
    drivers: [],
    producers: [],
    agents: [],
    agentPayments: [],
    config: createDefaultConfig(),
    syncStatus: navigator.onLine ? 'synced' : 'offline',
    lastSyncTime: null,
    lastSyncError: null,
    user: auth.currentUser,
    authLoading: true,
    isSyncing: false,
    isLoaded: false,
    sharedCompanyMode: localStorage.getItem(SHARED_COMPANY_MODE_KEY) !== 'false',
  };

  constructor() {
    void this.init();
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): StoreSnapshot => {
    return this.state;
  };

  private emit(partial?: Partial<StoreSnapshot>): void {
    if (partial) {
      this.state = { ...this.state, ...partial };
    }
    for (const listener of this.listeners) {
      listener();
    }
  }

  private async init(): Promise<void> {
    await this.loadFromIndexedDB();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        const hasPending = this.state.travels.some((t) => t.isDirty);
        this.emit({ syncStatus: hasPending ? 'pending' : 'synced' });
        if (this.state.user) {
          void this.syncAll({ bypassCooldown: true });
        }
      });
      window.addEventListener('offline', () => {
        this.emit({ syncStatus: 'offline' });
      });
    }

    onAuthStateChanged(auth, (user) => {
      this.emit({ user, authLoading: false });
      void this.syncAll({ bypassCooldown: true });
    });
  }

  private async readWebAppBridgeTravels(config: AppConfig): Promise<Travel[]> {
    try {
      if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') {
        return [];
      }
      const dbs = await indexedDB.databases();
      if (!dbs.some((d) => d.name === 'KmpTravelLocalDb')) {
        return [];
      }
      return await new Promise<Travel[]>((resolve) => {
        const req = indexedDB.open('KmpTravelLocalDb');
        req.onerror = () => resolve([]);
        req.onsuccess = () => {
          try {
            const idb = req.result;
            if (!idb.objectStoreNames.contains('travels')) {
              idb.close();
              resolve([]);
              return;
            }
            const tx = idb.transaction('travels', 'readonly');
            const store = tx.objectStore('travels');
            const getAllReq = store.getAll();
            getAllReq.onerror = () => {
              idb.close();
              resolve([]);
            };
            getAllReq.onsuccess = () => {
              const rows = Array.isArray(getAllReq.result) ? getAllReq.result : [];
              const parsed = rows
                .map((r) =>
                  normalizeTravelFromDoc(
                    (r || {}) as Record<string, unknown>,
                    String((r as Record<string, unknown>)?.firebaseId ?? (r as Record<string, unknown>)?.id ?? ''),
                    config
                  )
                )
                .filter((t): t is Travel => Boolean(t) && t.id !== 101 && t.id !== 102);
              idb.close();
              resolve(parsed);
            };
          } catch {
            resolve([]);
          }
        };
      });
    } catch {
      return [];
    }
  }

  async loadFromIndexedDB(): Promise<void> {
    try {
      const [travels, trucks, trailers, drivers, producers, agents, agentPayments, configs] =
        await Promise.all([
          localDb.travels.toArray(),
          localDb.trucks.toArray(),
          localDb.trailers.toArray(),
          localDb.drivers.toArray(),
          localDb.producers.toArray(),
          localDb.agents.toArray(),
          localDb.agentPayments.toArray(),
          localDb.config.toArray(),
        ]);

      const cfg = configs.find((c) => c.id === 'default') || configs[0] || createDefaultConfig();

      let mergedTravels = [...travels];
      if (mergedTravels.length === 0) {
        const bridged = await this.readWebAppBridgeTravels(cfg);
        if (bridged.length > 0) {
          mergedTravels = bridged;
          await localDb.travels.bulkPut(bridged);
        }
      }

      const sortedTravels = mergedTravels
        .filter((t) => t.id !== 101 && t.id !== 102)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));

      this.emit({
        travels: sortedTravels,
        trucks: trucks.filter((t) => !isDummyTruck(t)),
        trailers: trailers.filter((t) => !isDummyTrailer(t)),
        drivers: drivers.filter((d) => !isDummyDriver(d)),
        producers: producers.filter((p) => !isDummyProducer(p)),
        agents: agents.filter((a) => !isDummyAgent(a)),
        agentPayments,
        config: cfg,
        isLoaded: true,
        syncStatus: !navigator.onLine
          ? 'offline'
          : sortedTravels.some((t) => t.isDirty)
          ? 'pending'
          : 'synced',
      });
    } catch (err) {
      console.error('Error loading IndexedDB:', err);
      this.emit({ isLoaded: true });
    }
  }

  setSharedCompanyMode(enabled: boolean): void {
    localStorage.setItem(SHARED_COMPANY_MODE_KEY, enabled ? 'true' : 'false');
    localStorage.setItem(LAST_MASTER_TS_KEY, '0');
    localStorage.setItem(LAST_TRAVELS_TS_KEY, '0');
    this.emit({ sharedCompanyMode: enabled });
    if (this.state.user) {
      void this.syncAll({ forceFullSync: true, bypassCooldown: true });
    }
  }

  // MARK: - Authentication

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err;
    }
  }

  async signOutUser(): Promise<void> {
    await signOut(auth);
    localStorage.setItem(LAST_MASTER_TS_KEY, '0');
    localStorage.setItem(LAST_TRAVELS_TS_KEY, '0');
    this.lastSyncSuccessAt = 0;
    this.emit({ user: null });
  }

  // MARK: - Travel CRUD

  async saveTravel(travel: Travel): Promise<Travel> {
    const timestamp = Date.now();
    const calculatedBuy = TravelCalculator.applyFullCalculation(travel.buy, this.state.config);
    const updated: Travel = {
      ...travel,
      buy: calculatedBuy,
      updatedAt: timestamp,
      isDirty: true,
    };

    const nextTravels = [...this.state.travels];
    const idx = nextTravels.findIndex((t) => t.id === updated.id);
    if (idx >= 0) {
      nextTravels[idx] = updated;
    } else {
      nextTravels.unshift(updated);
    }
    nextTravels.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));

    await localDb.travels.put(updated);
    this.emit({
      travels: nextTravels,
      syncStatus: navigator.onLine ? 'pending' : 'offline',
    });

    if (this.state.user && navigator.onLine) {
      await this.uploadSingleTravel(updated);
    }
    return updated;
  }

  async deleteTravel(id: number): Promise<void> {
    const existing = this.state.travels.find((t) => t.id === id);
    const nextTravels = this.state.travels.filter((t) => t.id !== id);
    await localDb.travels.delete(id);
    this.emit({ travels: nextTravels });

    if (this.state.user && navigator.onLine) {
      try {
        const docId = existing?.rawDocId || String(id);
        await deleteDoc(doc(db, 'travels', docId));
      } catch (err) {
        console.warn('Error eliminando viaje en Firestore:', err);
      }
    }
  }

  // MARK: - Fleet CRUD

  async saveTruck(truck: Truck): Promise<void> {
    if (isDummyTruck(truck)) return;
    const t: Truck = { ...truck, updatedAt: Date.now(), isDirty: true };
    const next = [...this.state.trucks];
    const idx = next.findIndex((x) => x.id === t.id);
    if (idx >= 0) next[idx] = t;
    else next.push(t);

    await localDb.trucks.put(t);
    this.emit({ trucks: next });

    if (this.state.user && navigator.onLine) {
      const payload = {
        id: t.id,
        name: t.name,
        licensePlate: t.licensePlate,
        vtvExpiration: t.vtvExpiration,
        insuranceExpiration: t.insuranceExpiration,
        driverId: t.driver.id,
        trailerId: t.trailer.id,
        driver: isDummyDriver(t.driver) ? null : t.driver,
        trailer: isDummyTrailer(t.trailer) ? null : t.trailer,
        averageEfficiency: t.averageEfficiency,
        isFreightPaid: t.isFreightPaid,
        updatedAt: t.updatedAt,
      };
      await this.uploadMasterEntity(`TRUCK_${t.id}`, 'TRUCK', payload);
    }
  }

  async deleteTruck(id: number): Promise<void> {
    const next = this.state.trucks.filter((t) => t.id !== id);
    await localDb.trucks.delete(id);
    this.emit({ trucks: next });
    if (this.state.user && navigator.onLine) {
      await this.deleteRemoteMasterEntity(`TRUCK_${id}`);
    }
  }

  async saveDriver(driver: Driver): Promise<void> {
    if (isDummyDriver(driver)) return;
    const next = [...this.state.drivers];
    const idx = next.findIndex((d) => d.id === driver.id);
    if (idx >= 0) next[idx] = driver;
    else next.push(driver);

    const updatedTrucks = this.state.trucks.map((t) =>
      t.driver.id === driver.id ? { ...t, driver } : t
    );

    await Promise.all([localDb.drivers.put(driver), localDb.trucks.bulkPut(updatedTrucks)]);
    this.emit({ drivers: next, trucks: updatedTrucks });

    if (this.state.user && navigator.onLine) {
      await this.uploadMasterEntity(`DRIVER_${driver.id}`, 'DRIVER', {
        ...driver,
        updatedAt: Date.now(),
      });
    }
  }

  async deleteDriver(id: number): Promise<void> {
    const next = this.state.drivers.filter((d) => d.id !== id);
    await localDb.drivers.delete(id);
    this.emit({ drivers: next });
    if (this.state.user && navigator.onLine) {
      await this.deleteRemoteMasterEntity(`DRIVER_${id}`);
    }
  }

  async saveTrailer(trailer: Trailer): Promise<void> {
    if (isDummyTrailer(trailer)) return;
    const next = [...this.state.trailers];
    const idx = next.findIndex((t) => t.id === trailer.id);
    if (idx >= 0) next[idx] = trailer;
    else next.push(trailer);

    const updatedTrucks = this.state.trucks.map((t) =>
      t.trailer.id === trailer.id ? { ...t, trailer } : t
    );

    await Promise.all([localDb.trailers.put(trailer), localDb.trucks.bulkPut(updatedTrucks)]);
    this.emit({ trailers: next, trucks: updatedTrucks });

    if (this.state.user && navigator.onLine) {
      await this.uploadMasterEntity(`TRAILER_${trailer.id}`, 'TRAILER', {
        ...trailer,
        updatedAt: Date.now(),
      });
    }
  }

  async deleteTrailer(id: number): Promise<void> {
    const next = this.state.trailers.filter((t) => t.id !== id);
    await localDb.trailers.delete(id);
    this.emit({ trailers: next });
    if (this.state.user && navigator.onLine) {
      await this.deleteRemoteMasterEntity(`TRAILER_${id}`);
    }
  }

  // MARK: - Master Data CRUD (Producers, Agents, Payments, Config)

  async saveProducer(producer: Producer): Promise<void> {
    if (isDummyProducer(producer)) return;
    const next = [...this.state.producers];
    const idx = next.findIndex((p) => p.id === producer.id);
    if (idx >= 0) next[idx] = producer;
    else next.push(producer);

    await localDb.producers.put(producer);
    this.emit({ producers: next });

    if (this.state.user && navigator.onLine) {
      await this.uploadMasterEntity(`PRODUCER_${producer.id}`, 'PRODUCER', {
        id: producer.id,
        name: producer.name,
        phone: producer.phone,
        cuit: producer.cuit,
        cbu: producer.cbu,
        updatedAt: Date.now(),
      });
    }
  }

  async deleteProducer(id: number): Promise<void> {
    const next = this.state.producers.filter((p) => p.id !== id);
    await localDb.producers.delete(id);
    this.emit({ producers: next });
    if (this.state.user && navigator.onLine) {
      await this.deleteRemoteMasterEntity(`PRODUCER_${id}`);
    }
  }

  async saveAgent(agent: Agent): Promise<void> {
    if (isDummyAgent(agent)) return;
    const next = [...this.state.agents];
    const idx = next.findIndex((a) => a.id === agent.id);
    if (idx >= 0) next[idx] = agent;
    else next.push(agent);

    await localDb.agents.put(agent);
    this.emit({ agents: next });

    if (this.state.user && navigator.onLine) {
      await this.uploadMasterEntity(`AGENT_${agent.id}`, 'AGENT', {
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        percent: agent.percent,
        updatedAt: Date.now(),
      });
    }
  }

  async deleteAgent(id: number): Promise<void> {
    const next = this.state.agents.filter((a) => a.id !== id);
    await localDb.agents.delete(id);
    this.emit({ agents: next });
    if (this.state.user && navigator.onLine) {
      await this.deleteRemoteMasterEntity(`AGENT_${id}`);
    }
  }

  async saveAgentPayment(payment: AgentPayment): Promise<void> {
    const p: AgentPayment = { ...payment, updatedAt: Date.now() };
    const next = [...this.state.agentPayments];
    const idx = next.findIndex((x) => x.id === p.id);
    if (idx >= 0) next[idx] = p;
    else next.unshift(p);

    await localDb.agentPayments.put(p);
    this.emit({ agentPayments: next });

    if (this.state.user && navigator.onLine) {
      await this.uploadMasterEntity(`AGENT_PAYMENT_${p.id}`, 'AGENT_PAYMENT', p);
    }
  }

  async deleteAgentPayment(id: number): Promise<void> {
    const next = this.state.agentPayments.filter((p) => p.id !== id);
    await localDb.agentPayments.delete(id);
    this.emit({ agentPayments: next });
    if (this.state.user && navigator.onLine) {
      await this.deleteRemoteMasterEntity(`AGENT_PAYMENT_${id}`);
    }
  }

  async saveConfig(newConfig: AppConfig): Promise<void> {
    const cfg: AppConfig = {
      ...newConfig,
      id: 'default',
      updatedAt: Date.now(),
      isDirty: false,
    };
    await localDb.config.put(cfg);
    this.emit({ config: cfg });

    if (this.state.user && navigator.onLine) {
      await this.uploadMasterEntity('APP_CONFIG_default', 'APP_CONFIG', cfg);
    }
  }

  // MARK: - Firestore Sync Implementation

  private async uploadSingleTravel(travel: Travel): Promise<void> {
    const user = this.state.user;
    if (!user) return;
    const timestamp = travel.updatedAt > 0 ? travel.updatedAt : Date.now();
    const docId = travel.rawDocId || String(travel.id);
    const dict = travelToFirestoreDict(travel, user.uid, timestamp);

    try {
      await setDoc(doc(db, 'travels', docId), dict, { merge: true });
      const cleanTravel: Travel = { ...travel, rawDocId: docId, isDirty: false };
      await localDb.travels.put(cleanTravel);
      const nextTravels = this.state.travels.map((t) => (t.id === travel.id ? cleanTravel : t));
      const stillPending = nextTravels.some((t) => t.isDirty);
      this.emit({
        travels: nextTravels,
        syncStatus: stillPending ? 'pending' : 'synced',
        lastSyncTime: Date.now(),
      });
    } catch (err) {
      console.warn('Error subiendo viaje a Firestore:', err);
      this.emit({ syncStatus: 'error' });
    }
  }

  private async uploadMasterEntity(id: string, type: string, entity: unknown): Promise<void> {
    const user = this.state.user;
    if (!user) return;
    try {
      await setDoc(
        doc(db, 'master_data', id),
        {
          id,
          type,
          data: JSON.stringify(entity),
          updatedAt: Date.now(),
          userId: user.uid,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn(`Error subiendo master_data ${id}:`, err);
    }
  }

  private async deleteRemoteMasterEntity(id: string): Promise<void> {
    if (!this.state.user) return;
    try {
      await deleteDoc(doc(db, 'master_data', id));
    } catch (err) {
      console.warn(`Error eliminando master_data ${id}:`, err);
    }
  }

  async syncAll(opts: { forceFullSync?: boolean; bypassCooldown?: boolean } = {}): Promise<SyncResult> {
    const { forceFullSync = false, bypassCooldown = false } = opts;

    if (this.isSyncInProgress) {
      return {
        ok: true,
        travelsCount: this.state.travels.length,
        trucksCount: this.state.trucks.length,
        producersCount: this.state.producers.length,
      };
    }
    if (!navigator.onLine) {
      const msg = 'Sin conexión a internet.';
      this.emit({ syncStatus: 'offline', lastSyncError: msg });
      return {
        ok: false,
        travelsCount: this.state.travels.length,
        trucksCount: this.state.trucks.length,
        producersCount: this.state.producers.length,
        error: msg,
      };
    }

    if (!forceFullSync && !bypassCooldown && this.lastSyncSuccessAt > 0) {
      if (Date.now() - this.lastSyncSuccessAt < this.cooldownMs) {
        return {
          ok: true,
          travelsCount: this.state.travels.length,
          trucksCount: this.state.trucks.length,
          producersCount: this.state.producers.length,
        };
      }
    }

    // Esperar hasta 2.5s a que Firebase Auth termine de restaurar sesión desde IndexedDB
    try {
      await Promise.race([
        auth.authStateReady(),
        new Promise<void>((resolve) => setTimeout(resolve, 2500)),
      ]);
    } catch {
      // Continuar con el estado actual de auth
    }

    const user = auth.currentUser;
    this.isSyncInProgress = true;
    this.emit({ isSyncing: true, syncStatus: 'pending', lastSyncError: null, user });

    const syncStartTime = Date.now();

    try {
      // 1. Subir viajes locales pendientes (isDirty) si hay usuario autenticado
      if (user) {
        for (const t of this.state.travels) {
          if (t.isDirty) {
            const ts = t.updatedAt > 0 ? t.updatedAt : syncStartTime;
            const docId = t.rawDocId || String(t.id);
            await setDoc(doc(db, 'travels', docId), travelToFirestoreDict(t, user.uid, ts), {
              merge: true,
            });
          }
        }
      }

      // 2. Consultar master_data (lectura pública permitida), y travels + proveedores si hay sesión
      const masterPromise = getDocs(query(collection(db, 'master_data')));
      const travelsPromise = user
        ? getDocs(query(collection(db, 'travels')))
        : Promise.resolve(null);
      const proveedoresPromise = user
        ? getDocs(query(collection(db, 'proveedores'))).catch(() => null)
        : Promise.resolve(null);

      const [masterSnap, travelsSnap, proveedoresSnap] = await Promise.all([
        masterPromise,
        travelsPromise,
        proveedoresPromise,
      ]);

      const downloadedDrivers: Driver[] = [];
      const downloadedTrailers: Trailer[] = [];
      const downloadedProducers: Producer[] = [];
      const downloadedAgents: Agent[] = [];
      const downloadedPayments: AgentPayment[] = [];
      const truckPayloads: Array<{ payload: Record<string, unknown>; docId: string }> = [];
      let downloadedConfig: AppConfig | null = null;
      let maxMasterUpdatedAt = 0;

      masterSnap.forEach((docSnap) => {
        const d = docSnap.data() as Record<string, unknown>;
        if (!this.state.sharedCompanyMode && user && d.userId && d.userId !== user.uid) {
          return;
        }
        const docUpd = toNum(d.updatedAt, 0);
        if (docUpd > maxMasterUpdatedAt) maxMasterUpdatedAt = docUpd;

        const type = String(d.type ?? '').toUpperCase();
        let payload: Record<string, unknown> | null = null;
        if (typeof d.data === 'string' && d.data.trim()) {
          try {
            payload = JSON.parse(d.data) as Record<string, unknown>;
          } catch {
            payload = null;
          }
        } else {
          payload = d;
        }
        if (!payload) return;

        switch (type) {
          case 'DRIVER': {
            const drv = normalizeDriver(payload, docSnap.id);
            if (drv.id && !isDummyDriver(drv)) downloadedDrivers.push(drv);
            break;
          }
          case 'TRAILER': {
            const trl = normalizeTrailer(payload, docSnap.id);
            if (trl.id && !isDummyTrailer(trl)) downloadedTrailers.push(trl);
            break;
          }
          case 'PRODUCER': {
            const prod = normalizeProducer(payload, false, docSnap.id);
            if (prod.id && !isDummyProducer(prod)) downloadedProducers.push(prod);
            break;
          }
          case 'AGENT': {
            const ag = normalizeAgent(payload, docSnap.id);
            if (ag.id && !isDummyAgent(ag)) downloadedAgents.push(ag);
            break;
          }
          case 'AGENT_PAYMENT': {
            downloadedPayments.push({
              id: toNumId(payload.id, docSnap.id),
              agentId: toNumId(payload.agentId),
              amount: toNum(payload.amount, 0),
              date: String(payload.date ?? ''),
              description: String(payload.description ?? ''),
              updatedAt: toNum(payload.updatedAt, docUpd),
            });
            break;
          }
          case 'TRUCK': {
            truckPayloads.push({ payload, docId: docSnap.id });
            break;
          }
          case 'APP_CONFIG': {
            downloadedConfig = createDefaultConfig({
              ...(payload as Partial<AppConfig>),
              id: 'default',
            });
            break;
          }
          default:
            break;
        }
      });

      if (proveedoresSnap) {
        proveedoresSnap.forEach((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          const prod = normalizeProducer(d, false, docSnap.id);
          if (prod.id && prod.name && !isDummyProducer(prod)) {
            downloadedProducers.push(prod);
          }
        });
      }

      if (!downloadedConfig) {
        try {
          const cfgSnap = await getDoc(doc(db, 'master_data', 'APP_CONFIG_default'));
          if (cfgSnap.exists()) {
            const d = cfgSnap.data() as Record<string, unknown>;
            const raw =
              typeof d.data === 'string'
                ? (JSON.parse(d.data) as Partial<AppConfig>)
                : (d as Partial<AppConfig>);
            if (raw && toNum(raw.updatedAt, 0) >= (this.state.config.updatedAt || 0)) {
              downloadedConfig = createDefaultConfig({ ...raw, id: 'default' });
            }
          }
        } catch {
          // Ignorar si no existe configuración remota aún
        }
      }

      const activeConfig = downloadedConfig || this.state.config;

      const mergeById = <T extends { id: number }>(existing: T[], incoming: T[]): T[] => {
        const map = new Map<number, T>();
        for (const item of existing) map.set(item.id, item);
        for (const item of incoming) map.set(item.id, item);
        return Array.from(map.values());
      };

      let nextDrivers = mergeById(this.state.drivers, downloadedDrivers).filter((d) => !isDummyDriver(d));
      let nextTrailers = mergeById(this.state.trailers, downloadedTrailers).filter((t) => !isDummyTrailer(t));
      let nextProducers = mergeById(this.state.producers, downloadedProducers).filter((p) => !isDummyProducer(p));
      let nextAgents = mergeById(this.state.agents, downloadedAgents).filter((a) => !isDummyAgent(a));
      const nextPayments = mergeById(this.state.agentPayments, downloadedPayments);

      const resolvedTrucks = truckPayloads
        .map((item) => normalizeTruck(item.payload, nextDrivers, nextTrailers, item.docId))
        .filter((t) => t.id && !isDummyTruck(t));
      let nextTrucks = mergeById(this.state.trucks, resolvedTrucks).filter((t) => !isDummyTruck(t));

      // 3. Procesar travels descargados (y puente con KmpTravelLocalDb si existe)
      const remoteTravels: Travel[] = [];
      let maxTravelUpdatedAt = 0;

      if (travelsSnap) {
        travelsSnap.forEach((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          if (!this.state.sharedCompanyMode && user && d.userId && d.userId !== user.uid) {
            return;
          }
          const docUpd = toNum(d.updatedAt, 0);
          if (docUpd > maxTravelUpdatedAt) maxTravelUpdatedAt = docUpd;

          const travel = normalizeTravelFromDoc(d, docSnap.id, activeConfig);
          if (travel && travel.id !== 101 && travel.id !== 102) {
            remoteTravels.push(travel);
          }
        });
      }

      const bridgedTravels = await this.readWebAppBridgeTravels(activeConfig);

      const travelsMap = new Map<number, Travel>();
      for (const bt of bridgedTravels) {
        travelsMap.set(bt.id, bt);
      }
      for (const t of this.state.travels) {
        travelsMap.set(t.id, user ? { ...t, isDirty: false } : t);
      }

      for (const remote of remoteTravels) {
        const existing = travelsMap.get(remote.id);
        if (!existing || remote.updatedAt >= existing.updatedAt) {
          travelsMap.set(remote.id, remote);
        }

        // Auto-cosecha de entidades desde viajes
        const tr = remote.truck;
        if (tr.name && !isDummyTruck(tr)) {
          const existingTruckIdx = nextTrucks.findIndex(
            (x) => x.id === tr.id || (x.name === tr.name && x.licensePlate === tr.licensePlate)
          );
          if (existingTruckIdx >= 0) {
            if (!nextTrucks[existingTruckIdx].name && tr.name) {
              nextTrucks[existingTruckIdx] = tr;
            }
          } else {
            nextTrucks.push(tr);
          }

          if (
            tr.driver?.name &&
            !isDummyDriver(tr.driver) &&
            !nextDrivers.some((d) => d.id === tr.driver.id || d.name === tr.driver.name)
          ) {
            nextDrivers.push(tr.driver);
          }

          if (
            tr.trailer?.name &&
            !isDummyTrailer(tr.trailer) &&
            !nextTrailers.some((x) => x.id === tr.trailer.id || x.name === tr.trailer.name)
          ) {
            nextTrailers.push(tr.trailer);
          }
        }

        for (const p of remote.buy?.listOfProducers || []) {
          if (
            p.name &&
            !isDummyProducer(p) &&
            !nextProducers.some((x) => x.id === p.id || x.name === p.name)
          ) {
            nextProducers.push({ ...p, listOfProducts: [] });
          }
        }

        const ag = remote.buy?.agent;
        if (
          ag &&
          ag.name &&
          !isDummyAgent(ag) &&
          !nextAgents.some((x) => x.id === ag.id || x.name === ag.name)
        ) {
          nextAgents.push(ag);
        }
      }

      const nextTravels = Array.from(travelsMap.values()).sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id
      );

      await localDb.transaction(
        'rw',
        [
          localDb.travels,
          localDb.trucks,
          localDb.trailers,
          localDb.drivers,
          localDb.producers,
          localDb.agents,
          localDb.agentPayments,
          localDb.config,
        ],
        async () => {
          if (nextTravels.length > 0) await localDb.travels.bulkPut(nextTravels);
          if (nextTrucks.length > 0) await localDb.trucks.bulkPut(nextTrucks);
          if (nextTrailers.length > 0) await localDb.trailers.bulkPut(nextTrailers);
          if (nextDrivers.length > 0) await localDb.drivers.bulkPut(nextDrivers);
          if (nextProducers.length > 0) await localDb.producers.bulkPut(nextProducers);
          if (nextAgents.length > 0) await localDb.agents.bulkPut(nextAgents);
          if (nextPayments.length > 0) await localDb.agentPayments.bulkPut(nextPayments);
          await localDb.config.put(activeConfig);
        }
      );

      localStorage.setItem(LAST_MASTER_TS_KEY, String(Math.max(maxMasterUpdatedAt, syncStartTime)));
      localStorage.setItem(LAST_TRAVELS_TS_KEY, String(Math.max(maxTravelUpdatedAt, syncStartTime)));

      if (!user) {
        const msg = 'Iniciá sesión con Google para descargar viajes de Firestore.';
        this.emit({
          travels: nextTravels,
          trucks: nextTrucks,
          trailers: nextTrailers,
          drivers: nextDrivers,
          producers: nextProducers,
          agents: nextAgents,
          agentPayments: nextPayments,
          config: activeConfig,
          syncStatus: 'pending',
          lastSyncTime: Date.now(),
          lastSyncError: msg,
          isSyncing: false,
        });
        return {
          ok: false,
          travelsCount: nextTravels.length,
          trucksCount: nextTrucks.length,
          producersCount: nextProducers.length,
          error: msg,
        };
      }

      this.lastSyncSuccessAt = Date.now();
      this.emit({
        travels: nextTravels,
        trucks: nextTrucks,
        trailers: nextTrailers,
        drivers: nextDrivers,
        producers: nextProducers,
        agents: nextAgents,
        agentPayments: nextPayments,
        config: activeConfig,
        syncStatus: 'synced',
        lastSyncTime: Date.now(),
        lastSyncError: null,
        isSyncing: false,
      });

      return {
        ok: true,
        travelsCount: nextTravels.length,
        trucksCount: nextTrucks.length,
        producersCount: nextProducers.length,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Error en sincronización Firestore:', err);
      this.emit({
        syncStatus: navigator.onLine ? 'error' : 'offline',
        lastSyncError: errMsg,
        isSyncing: false,
      });
      return {
        ok: false,
        travelsCount: this.state.travels.length,
        trucksCount: this.state.trucks.length,
        producersCount: this.state.producers.length,
        error: errMsg,
      };
    } finally {
      this.isSyncInProgress = false;
    }
  }

  // MARK: - Backup JSON Export / Import / Clear

  exportBackupJson(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        app: 'IosFletes-PWA',
        travels: this.state.travels,
        trucks: this.state.trucks,
        trailers: this.state.trailers,
        drivers: this.state.drivers,
        producers: this.state.producers,
        agents: this.state.agents,
        agentPayments: this.state.agentPayments,
        config: this.state.config,
      },
      null,
      2
    );
  }

  async importBackupJson(rawJson: string): Promise<{ travelsCount: number }> {
    const parsed = JSON.parse(rawJson) as {
      travels?: Travel[];
      trucks?: Truck[];
      trailers?: Trailer[];
      drivers?: Driver[];
      producers?: Producer[];
      agents?: Agent[];
      agentPayments?: AgentPayment[];
      config?: AppConfig;
    };

    const nextConfig = parsed.config ? createDefaultConfig(parsed.config) : this.state.config;
    const travels = Array.isArray(parsed.travels)
      ? parsed.travels
          .map((t) => normalizeTravelFromDoc(t as unknown as Record<string, unknown>, String(t.id), nextConfig))
          .filter((t): t is Travel => Boolean(t))
      : this.state.travels;
    const trucks = Array.isArray(parsed.trucks) ? parsed.trucks : this.state.trucks;
    const trailers = Array.isArray(parsed.trailers) ? parsed.trailers : this.state.trailers;
    const drivers = Array.isArray(parsed.drivers) ? parsed.drivers : this.state.drivers;
    const producers = Array.isArray(parsed.producers) ? parsed.producers : this.state.producers;
    const agents = Array.isArray(parsed.agents) ? parsed.agents : this.state.agents;
    const agentPayments = Array.isArray(parsed.agentPayments)
      ? parsed.agentPayments
      : this.state.agentPayments;

    await localDb.transaction(
      'rw',
      [
        localDb.travels,
        localDb.trucks,
        localDb.trailers,
        localDb.drivers,
        localDb.producers,
        localDb.agents,
        localDb.agentPayments,
        localDb.config,
      ],
      async () => {
        await localDb.travels.clear();
        await localDb.trucks.clear();
        await localDb.trailers.clear();
        await localDb.drivers.clear();
        await localDb.producers.clear();
        await localDb.agents.clear();
        await localDb.agentPayments.clear();

        if (travels.length) await localDb.travels.bulkPut(travels);
        if (trucks.length) await localDb.trucks.bulkPut(trucks);
        if (trailers.length) await localDb.trailers.bulkPut(trailers);
        if (drivers.length) await localDb.drivers.bulkPut(drivers);
        if (producers.length) await localDb.producers.bulkPut(producers);
        if (agents.length) await localDb.agents.bulkPut(agents);
        if (agentPayments.length) await localDb.agentPayments.bulkPut(agentPayments);
        await localDb.config.put(nextConfig);
      }
    );

    const sortedTravels = [...travels].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    this.emit({
      travels: sortedTravels,
      trucks,
      trailers,
      drivers,
      producers,
      agents,
      agentPayments,
      config: nextConfig,
    });

    return { travelsCount: sortedTravels.length };
  }

  async clearAllLocalData(): Promise<void> {
    await localDb.transaction(
      'rw',
      [
        localDb.travels,
        localDb.trucks,
        localDb.trailers,
        localDb.drivers,
        localDb.producers,
        localDb.agents,
        localDb.agentPayments,
        localDb.config,
      ],
      async () => {
        await localDb.travels.clear();
        await localDb.trucks.clear();
        await localDb.trailers.clear();
        await localDb.drivers.clear();
        await localDb.producers.clear();
        await localDb.agents.clear();
        await localDb.agentPayments.clear();
        await localDb.config.clear();
      }
    );
    localStorage.setItem(LAST_MASTER_TS_KEY, '0');
    localStorage.setItem(LAST_TRAVELS_TS_KEY, '0');
    this.lastSyncSuccessAt = 0;

    this.emit({
      travels: [],
      trucks: [],
      trailers: [],
      drivers: [],
      producers: [],
      agents: [],
      agentPayments: [],
      config: createDefaultConfig(),
    });
  }
}

export const persistence = new PersistenceStore();
