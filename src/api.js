// webApp/src/api.js
import { collection, getDocs, getDoc, doc, updateDoc, setDoc, addDoc, query, where, limit, arrayUnion, writeBatch, deleteDoc, onSnapshot } from 'firebase/firestore';
import { localDb } from './db/localDb.js';

// ==========================================
// PHASE 1 IN-MEMORY CACHES FOR READ OPTIMIZATION
// ==========================================
let activeFaenasCache = null;
let activeFaenasListenerUnsubscribe = null;
let activeFaenasPromise = null;

let clientsCache = null;
let categoryPricesCache = null;
let camarasCache = null;

// Cache for recent dispatched faenas (valid for 2 minutes to reduce clicks overhead)
let recentDispatchedCache = null;
let recentDispatchedCacheTime = 0;
const RECENT_DISPATCHED_CACHE_DURATION = 2 * 60 * 1000; 

// ==========================================
// TTL CACHE — semi-static collections (reduces Firestore reads by ~65%)
// ==========================================
const _ttlCache = new Map(); // key -> { data, expiresAt }
const TTL_5MIN  = 5  * 60 * 1000;
const TTL_10MIN = 10 * 60 * 1000;

function _getCached(key) {
  const entry = _ttlCache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  _ttlCache.delete(key); // expired
  return null;
}
function _setCached(key, data, ttlMs = TTL_5MIN) {
  _ttlCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
function _invalidateCached(...keys) {
  keys.forEach(k => _ttlCache.delete(k));
}


/** Initialize active faenas listener globally (AVAILABLE and DRAFT) */
export function initActiveFaenasListener(db, uid) {
  if (activeFaenasListenerUnsubscribe) return;
  if (!uid) return;

  const collRef = collection(db, 'faenas_detalle');
  const q = query(collRef, where("status", "in", ["AVAILABLE", "DRAFT"]));

  console.log("[Firebase Sync] Initializing global listener for AVAILABLE and DRAFT faenas...");
  activeFaenasPromise = new Promise((resolve, reject) => {
    let resolved = false;
    activeFaenasListenerUnsubscribe = onSnapshot(q, (snapshot) => {
      activeFaenasCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`[Firebase Sync] Active faenas updated in cache. Count: ${activeFaenasCache.length}`);
      if (!resolved) {
        resolved = true;
        resolve(activeFaenasCache);
      }
    }, (error) => {
      console.error("[Firebase Sync] Error in active faenas onSnapshot:", error);
      if (!resolved) {
        resolved = true;
        reject(error);
      }
    });
  });
}

/** Helper to fetch and parse a root collection */
async function fetchAndParseRootCollection(db, uid, collName) {
  if (!uid) throw new Error("UID is required to fetch data");
  const collRef = collection(db, collName);
  const snapshot = await getDocs(collRef);
  
  return snapshot.docs.map(docSnap => {
    const dto = docSnap.data();
    
    try {
      // The domain object may be stored as a JSON string in the 'data' field.
      // BUT some fields like 'reduce' live at the TOP LEVEL of the Firestore document.
      // We must merge both: top-level fields FIRST, then parsed 'data' overrides them,
      // so that structured domain properties win over any stale top-level copies.
      const { data: rawData, updatedAt, createdAt, ...topLevelFields } = dto;
      if (rawData && typeof rawData === 'string') {
        const parsed = JSON.parse(rawData);
        // Top-level fields fill in any gaps not covered by the parsed 'data' object.
        // e.g. { reduce: 13800000 } at root merged with parsed buy/producers/etc.
        return { ...topLevelFields, ...parsed, firebaseId: docSnap.id };
      }
      return { id: docSnap.id, ...dto };
    } catch (e) {
      console.warn(`Error parsing data for ${collName} id ${docSnap.id}:`, e);
      return { id: docSnap.id, ...dto };
    }
  });
}

export async function fetchTravels(db, uid) {
  return localDb.travels.toArray();
}

export async function fetchBuys(db, uid) {
  // Buys are usually part of travels, but if they are separate:
  return fetchAndParseRootCollection(db, uid, 'buys');
}

export async function fetchTrucks(db, uid) {
  const cacheKey = 'master_data:TRUCK';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  if (!uid) throw new Error("UID is required to fetch data");
  const collRef = collection(db, 'master_data');
  const q = query(collRef, where('type', '==', 'TRUCK'));
  const snapshot = await getDocs(q);
  const result = snapshot.docs.map(docSnap => {
    const dto = docSnap.data();
    try {
      const { data: rawData, updatedAt, createdAt, ...topLevelFields } = dto;
      if (rawData && typeof rawData === 'string') {
        const parsed = JSON.parse(rawData);
        return { ...topLevelFields, ...parsed, firebaseId: docSnap.id };
      }
      return { id: docSnap.id, ...dto };
    } catch (e) {
      return { id: docSnap.id, ...dto };
    }
  });
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

/** Fetch master data of a specific type (AGENT, DRIVER, etc.) */
export async function fetchMasterData(db, uid, type) {
  const cacheKey = `master_data:${type}`;
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  if (!uid) throw new Error("UID is required to fetch data");
  const collRef = collection(db, 'master_data');
  const q = query(collRef, where('type', '==', type));
  const snapshot = await getDocs(q);
  const result = snapshot.docs.map(docSnap => {
    const dto = docSnap.data();
    try {
      const { data: rawData, updatedAt, createdAt, ...topLevelFields } = dto;
      if (rawData && typeof rawData === 'string') {
        const parsed = JSON.parse(rawData);
        return { ...topLevelFields, ...parsed, firebaseId: docSnap.id };
      }
      return { id: docSnap.id, ...dto };
    } catch (e) {
      return { id: docSnap.id, ...dto };
    }
  });
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

/** 
 * Update a travel document. 
 * Since the original structure stores a JSON string in 'data', we wrap it back.
 */
export async function updateTravel(db, uid, travelId, travelObject) {
  if (!uid) throw new Error("UID is required to update data");
  const docRef = doc(db, 'travels', String(travelId)); // Always string for Firestore
  const dataToSave = {
    data: JSON.stringify(travelObject),
    updatedAt: Date.now()
  };
  await updateDoc(docRef, dataToSave);
  
  // Write-Through Cache to Dexie
  await localDb.travels.put({
    ...travelObject,
    id: String(travelId),
    updatedAt: dataToSave.updatedAt
  });
}

export async function saveTravel(db, uid, travelObject) {
  if (!uid) throw new Error("UID is required to save data");
  const docRef = doc(db, 'travels', String(travelObject.id));
  const dataToSave = {
    data: JSON.stringify(travelObject),
    updatedAt: Date.now()
  };
  await setDoc(docRef, dataToSave);
  
  // Write-Through Cache to Dexie
  await localDb.travels.put({
    ...travelObject,
    updatedAt: dataToSave.updatedAt
  });
}

export async function deleteTravel(db, uid, travelId) {
  if (!uid) throw new Error("UID is required to delete data");
  const docRef = doc(db, 'travels', String(travelId));
  await deleteDoc(docRef);
  
  // Write-Through Cache to Dexie
  await localDb.travels.delete(String(travelId));
}


/**
 * Save detailed faena/carcass data for a specific travel.
 */
export async function saveFaenaDetalle(db, uid, faenaRecords) {
  if (!uid) throw new Error("UID is required to save details");
  const collRef = collection(db, 'faenas_detalle');
  const batch = writeBatch(db);
  
  const now = Date.now();
  const recordsToPut = [];

  faenaRecords.forEach(record => {
    const newDocRef = doc(collRef);
    const docId = newDocRef.id;
    const recordData = {
      ...record,
      id: docId,
      ownerUid: uid,
      createdAt: now,
      updatedAt: now
    };
    batch.set(newDocRef, recordData);
    recordsToPut.push(recordData);
  });
  
  await batch.commit();

  // Write-Through Cache to Dexie
  if (recordsToPut.length > 0) {
    await localDb.faenas_detalle.bulkPut(recordsToPut.map(r => ({
      ...r,
      barcode: r.barcode || null
    })));
  }

  invalidateRecentDispatchedCache();
}

/**
 * Check if a faena PDF was already processed by searching its filename in the details collection.
 */
export async function checkIfFaenaExists(db, uid, fileName) {
  if (!fileName) return false;
  const collRef = collection(db, 'faenas_detalle');
  const q = query(collRef, where("fileName", "==", fileName), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function checkIfTropaExists(db, uid, tropa) {
  if (!tropa) return false;
  const collRef = collection(db, 'faenas_detalle');
  const q = query(collRef, where("tropa", "==", tropa), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Invalidate recent dispatched cache when changes occur.
 */
export function invalidateRecentDispatchedCache() {
  recentDispatchedCache = null;
  recentDispatchedCacheTime = 0;
}

/**
 * Fetch active and recent (last 30 days) faena details.
 * AVAILABLE and DRAFT are fetched from memory cache (listener).
 * DISPATCHED are fetched from Firestore filtered by date (last 30 days) and cached for 2 minutes.
 */
export async function fetchFaenaDetalle(db, uid) {
  return localDb.faenas_detalle.toArray();
}

/**
 * Update the status of multiple faena detail records (e.g., to DISPATCHED).
 */
export async function updateFaenasStatus(db, uid, recordIds, updateData) {
  if (!uid || !recordIds || recordIds.length === 0) return;
  const batch = writeBatch(db);
  
  const now = Date.now();
  const fullUpdateData = {
    ...updateData,
    updatedAt: now
  };
  
  recordIds.forEach(id => {
    const docRef = doc(db, 'faenas_detalle', id);
    batch.update(docRef, fullUpdateData);
  });
  
  await batch.commit();

  // Write-Through Cache to Dexie
  for (const id of recordIds) {
    const existing = await localDb.faenas_detalle.get(id);
    if (existing) {
      await localDb.faenas_detalle.put({
        ...existing,
        ...fullUpdateData
      });
    }
  }

  invalidateRecentDispatchedCache();
}

/**
 * Fetch dispatched faenas for a client in a date range.
 */
export async function fetchDispatchedFaenasInRange(db, clientName, startDate, endDate) {
  // Read from local IndexedDB (already synced) — avoids a full Firestore collection read
  let faenas = await localDb.faenas_detalle
    .where('status').equals('DISPATCHED')
    .toArray();

  if (clientName) {
    const q = clientName.toLowerCase();
    faenas = faenas.filter(f => (f.destination || '').toLowerCase() === q);
  }
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
    const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
    faenas = faenas.filter(f => f.dispatchDate >= start && f.dispatchDate <= end);
  }
  return faenas;
}

/**
 * Move faenas to another camera, recording the event in the history.
 */
export async function moveFaenasToCamara(db, uid, recordsInfo, camaraId) {
  if (!uid || !recordsInfo || recordsInfo.length === 0) return;
  const now = Date.now();
  const batch = writeBatch(db);
  
  recordsInfo.forEach(info => {
    const docRef = doc(db, 'faenas_detalle', info.id);
    const movement = { from: info.fromCamaraId || null, to: camaraId, date: now };
    batch.update(docRef, {
      camaraId: camaraId,
      movements: arrayUnion(movement),
      updatedAt: now
    });
  });
  
  await batch.commit();

  // Write-Through Cache to Dexie
  for (const info of recordsInfo) {
    const existing = await localDb.faenas_detalle.get(info.id);
    if (existing) {
      const movement = { from: info.fromCamaraId || null, to: camaraId, date: now };
      const movements = existing.movements ? [...existing.movements, movement] : [movement];
      await localDb.faenas_detalle.put({
        ...existing,
        camaraId,
        movements,
        updatedAt: now
      });
    }
  }

  invalidateRecentDispatchedCache();
}

/**
 * ACHURAS STOCK API
 */
export async function addAchurasBatch(db, uid, tropa, date, quantity) {
  if (!uid) throw new Error("UID is required to add achuras");
  const collRef = collection(db, 'achuras_stock');
  await addDoc(collRef, {
    ownerUid: uid,
    tropa: tropa,
    date: date || Date.now(),
    initialQuantity: quantity,
    availableQuantity: quantity,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  _invalidateCached('achuras_stock');
}

export async function fetchAchurasStock(db, uid) {
  const cacheKey = 'achuras_stock';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'achuras_stock');
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(d => d.availableQuantity > 0)
    .sort((a, b) => (a.date || 0) - (b.date || 0));
  _setCached(cacheKey, result, TTL_5MIN);
  return result;
}

export async function consumeAchuras(db, uid, quantityToConsume) {
  if (!uid) throw new Error("UID is required to consume achuras");
  
  // Fetch available batches sorted by date (FIFO)
  const batches = await fetchAchurasStock(db, uid);
  
  const totalAvailable = batches.reduce((sum, b) => sum + b.availableQuantity, 0);
  if (totalAvailable < quantityToConsume) {
    throw new Error(`Stock insuficiente de achuras. Disponible: ${totalAvailable}, Requerido: ${quantityToConsume}`);
  }
  
  let remainingToConsume = quantityToConsume;
  const batch = writeBatch(db);
  
  for (const b of batches) {
    if (remainingToConsume <= 0) break;
    
    const docRef = doc(db, 'achuras_stock', b.id);
    if (b.availableQuantity <= remainingToConsume) {
      batch.update(docRef, { availableQuantity: 0, updatedAt: Date.now() });
      remainingToConsume -= b.availableQuantity;
    } else {
      batch.update(docRef, { availableQuantity: b.availableQuantity - remainingToConsume, updatedAt: Date.now() });
      remainingToConsume = 0;
    }
  }
  
  await batch.commit();
  _invalidateCached('achuras_stock'); // stock changed
}

/** 
 * CLIENTS API
 */
export async function fetchClients(db) {
  if (clientsCache && clientsCache.length > 0) return clientsCache;
  const localClients = await localDb.clientes.toArray();
  // Only cache if we have data — avoids caching an empty result
  // during the initial sync race condition (IndexedDB empty on first load)
  if (localClients.length > 0) {
    clientsCache = localClients;
  }
  return localClients;
}

/** Invalidates the in-memory clients cache so the next call reads fresh data from IndexedDB. */
export function invalidateClientCache() {
  clientsCache = null;
}

export async function saveClient(db, clientRecord) {
  const collRef = collection(db, 'clientes');
  let clientRef;
  const now = Date.now();
  
  let savedRecord;
  if (clientRecord.id) {
    clientRef = doc(db, 'clientes', clientRecord.id);
    savedRecord = { ...clientRecord, updatedAt: now };
    await updateDoc(clientRef, savedRecord);
  } else {
    // Check if client with same name already exists to avoid duplicates
    const q = query(collRef, where("name", "==", clientRecord.name), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const existingId = snapshot.docs[0].id;
      clientRef = doc(db, 'clientes', existingId);
      savedRecord = { ...clientRecord, id: existingId, updatedAt: now };
      await updateDoc(clientRef, savedRecord);
    } else {
      const addedDoc = await addDoc(collRef, { ...clientRecord, createdAt: now, updatedAt: now });
      clientRef = addedDoc;
      savedRecord = { ...clientRecord, id: addedDoc.id, createdAt: now, updatedAt: now };
    }
  }

  // Write-Through Cache to Dexie
  await localDb.clientes.put(savedRecord);

  clientsCache = null; // Clear cache on change
  return clientRef.id;
}

/**
 * CONFIG API (Prices by Category)
 */
export async function fetchCategoryPrices(db) {
  if (categoryPricesCache) return categoryPricesCache;
  const docRef = doc(db, 'config', 'prices');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Return the nested prices object if it exists, otherwise the whole object for backward compatibility
    categoryPricesCache = data.prices || data || {};
    return categoryPricesCache;
  }
  return {};
}

export async function saveCategoryPrices(db, pricesRecord) {
  const docRef = doc(db, 'config', 'prices');
  await setDoc(docRef, { prices: pricesRecord, updatedAt: Date.now() });
  categoryPricesCache = null; // Clear cache on change
}

/**
 * CONFIG API (Camaras de Frio)
 */
export async function fetchCamaras(db) {
  if (camarasCache) return camarasCache;
  const docRef = doc(db, 'config', 'camaras');
  const docSnap = await getDoc(docRef);
  camarasCache = docSnap.exists() && docSnap.data().list ? docSnap.data().list : [];
  return camarasCache;
}

export async function saveCamaras(db, camarasList) {
  console.log("api.saveCamaras called with:", camarasList);
  const docRef = doc(db, 'config', 'camaras');
  await setDoc(docRef, { list: camarasList, updatedAt: Date.now() });
  console.log("api.saveCamaras successfully completed");
  camarasCache = null; // Clear cache on change
}

/**
 * USER PERMISSIONS API (RBAC)
 */
export async function fetchUserRole(db, user) {
  if (!user || !user.uid) return 'VISOR';
  const meta = await fetchUserMetadata(db, user);
  return meta.role || 'VISOR';
}

/**
 * Fetch the complete user metadata (role, email, allowed views, etc.) from user_metadata.
 */
export async function fetchUserMetadata(db, user) {
  if (!user || !user.uid) return { role: 'VISOR', allowedViews: [] };
  const docRef = doc(db, 'user_metadata', user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    let updates = {};
    if (user.uid === 'iqy12KgqiDU0Z1QwwbqRSqvSpCM2' && data.role !== 'ADMIN') {
      updates.role = 'ADMIN';
    }
    if (!data.email && user.email) {
      updates.email = user.email;
    }
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = Date.now();
      await setDoc(docRef, updates, { merge: true });
    }
    return { ...data, ...updates };
  }

  const role = user.uid === 'iqy12KgqiDU0Z1QwwbqRSqvSpCM2' ? 'ADMIN' : 'VISOR';
  const defaultMeta = { role, email: user.email || '', allowedViews: [], createdAt: Date.now() };
  console.log(`Setting default metadata ${role} for user ${user.uid}`);
  await setDoc(docRef, defaultMeta);
  return defaultMeta;
}

export async function fetchAllUsersRoles(db) {
  const cacheKey = 'user_metadata:all';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const snapshot = await getDocs(collection(db, 'user_metadata'));
  const result = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

export async function saveUserRole(db, uid, role, allowedViews = null) {
  const docRef = doc(db, 'user_metadata', uid);
  const updateData = { role, updatedAt: Date.now() };
  if (allowedViews !== null) {
    updateData.allowedViews = allowedViews;
  }
  await setDoc(docRef, updateData, { merge: true });
  _invalidateCached('user_metadata:all');
}

export async function deleteUserMetadata(db, uid) {
  const docRef = doc(db, 'user_metadata', uid);
  await deleteDoc(docRef);
  _invalidateCached('user_metadata:all');
}

/**
 * TRANSACTIONS API (Debt and Payments)
 */
export async function fetchTransactions(db, clientId) {
  const collRef = collection(db, 'transactions');
  const q = query(collRef, where("clientId", "==", clientId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function fetchAllTransactions(db) {
  const cacheKey = 'transactions:all';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'transactions');
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  _setCached(cacheKey, result, TTL_5MIN);
  return result;
}

export async function addTransaction(db, transactionRecord) {
  const collRef = collection(db, 'transactions');
  await addDoc(collRef, { ...transactionRecord, createdAt: Date.now() });
  _invalidateCached('transactions:all');
}

export async function syncTransactionByCheck(db, collectionName, checkId, side, transactionData) {
  const collRef = collection(db, collectionName);
  const q = query(collRef, where("checkId", "==", checkId), where("checkSide", "==", side));
  const snapshot = await getDocs(q);
  
  if (!transactionData) {
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, collectionName, docSnap.id));
    }
    return;
  }
  
  if (!snapshot.empty) {
    const docRef = doc(db, collectionName, snapshot.docs[0].id);
    await updateDoc(docRef, { ...transactionData, updatedAt: Date.now() });
  } else {
    await addDoc(collRef, { ...transactionData, checkId, checkSide: side, createdAt: Date.now() });
  }
}

/**
 * CHECK OPERATORS API
 */
export async function fetchOperators(db) {
  const cacheKey = 'check_operators';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'check_operators');
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

export async function saveOperator(db, operatorData) {
  if (operatorData.id) {
    const docRef = doc(db, 'check_operators', operatorData.id);
    await updateDoc(docRef, { ...operatorData, updatedAt: Date.now() });
    _invalidateCached('check_operators');
    return operatorData.id;
  } else {
    const collRef = collection(db, 'check_operators');
    const docRef = await addDoc(collRef, { ...operatorData, createdAt: Date.now() });
    _invalidateCached('check_operators');
    return docRef.id;
  }
}

export async function fetchOperatorTransactions(db, operatorId) {
  const collRef = collection(db, 'operator_transactions');
  const q = query(collRef, where("operatorId", "==", operatorId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function fetchAllOperatorTransactions(db) {
  const cacheKey = 'operator_transactions:all';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'operator_transactions');
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  _setCached(cacheKey, result, TTL_5MIN);
  return result;
}

export async function addOperatorTransaction(db, transactionRecord) {
  const collRef = collection(db, 'operator_transactions');
  await addDoc(collRef, { ...transactionRecord, createdAt: Date.now() });
  _invalidateCached('operator_transactions:all');
}

export async function fetchTransactionsInRange(db, clientId, startDate, endDate) {
  const collRef = collection(db, 'transactions');
  let q = query(collRef, where("clientId", "==", clientId));
  
  const snapshot = await getDocs(q);
  let txs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
    const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
    txs = txs.filter(t => {
      const d = t.date || t.createdAt;
      return d >= start && d <= end;
    });
  }
  return txs;
}

/**
 * CHECK OPERATIONS API
 */
export async function fetchCheckOperations(db, uid) {
  const cacheKey = 'check_operations';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'check_operations');
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  _setCached(cacheKey, result, TTL_5MIN);
  return result;
}

export async function saveCheckOperation(db, uid, operation) {
  if (!uid) throw new Error("UID is required to save checks");
  const collRef = collection(db, 'check_operations');
  let docRef;
  
  // Destructure id out so it is NOT part of the data sent to Firestore
  const { id, ...operationData } = operation;
  
  const dataToSave = {
    ...operationData,
    ownerUid: uid,
    updatedAt: Date.now()
  };

  if (id) {
    docRef = doc(db, 'check_operations', id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = Date.now();
    docRef = await addDoc(collRef, dataToSave);
  }
  _invalidateCached('check_operations');
  return docRef.id;
}

export async function deleteCheckOperation(db, operationId) {
  const docRef = doc(db, 'check_operations', operationId);
  await deleteDoc(docRef);
  _invalidateCached('check_operations');
}

/**
 * ACCOUNTING API
 */
export async function fetchAccountingEntries(db, uid, collectionName = 'accounting_entries') {
  const cacheKey = `accounting:${collectionName}`;
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  // Shared cash register — no ownerUid filter needed
  const collRef = collection(db, collectionName);
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  _setCached(cacheKey, result, TTL_5MIN);
  return result;
}

export async function saveAccountingEntry(db, uid, entry, collectionName = 'accounting_entries') {
  if (!uid) throw new Error("UID is required to save accounting");
  const collRef = collection(db, collectionName);
  let docRef;
  
  const { id, ...entryData } = entry;
  const dataToSave = {
    ...entryData,
    ownerUid: uid,
    updatedAt: Date.now()
  };

  if (id) {
    docRef = doc(db, collectionName, id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = Date.now();
    docRef = await addDoc(collRef, dataToSave);
  }
  _invalidateCached(`accounting:${collectionName}`);
  return docRef.id;
}

export async function deleteAccountingEntry(db, entryId, collectionName = 'accounting_entries') {
  const docRef = doc(db, collectionName, entryId);
  await deleteDoc(docRef);
  await removeLinkedTransaction(db, entryId);
  _invalidateCached(`accounting:${collectionName}`, 'transactions:all');
}

export async function removeLinkedTransaction(db, accountingEntryId) {
  const transColl = collection(db, 'transactions');
  const q = query(transColl, where("accountingEntryId", "==", accountingEntryId));
  const snapshot = await getDocs(q);
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'transactions', docSnap.id));
  }
}

export async function syncAccountingToTransaction(db, accountingEntryId, transactionData) {
  const transColl = collection(db, 'transactions');
  const q = query(transColl, where("accountingEntryId", "==", accountingEntryId));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    // Update existing
    const transDocId = snapshot.docs[0].id;
    await updateDoc(doc(db, 'transactions', transDocId), { 
      ...transactionData, 
      updatedAt: Date.now() 
    });
  } else {
    // Create new
    await addDoc(transColl, { 
      ...transactionData, 
      accountingEntryId, 
      createdAt: Date.now() 
    });
  }
}

/**
 * PRICE ANALYSIS API
 */
export async function savePriceAnalysis(db, analysis) {
  const collRef = collection(db, 'price_analyses');
  let docRef;
  const { id, ...data } = analysis;
  const dataToSave = { ...data, updatedAt: Date.now() };

  if (id) {
    docRef = doc(db, 'price_analyses', id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = Date.now();
    docRef = await addDoc(collRef, dataToSave);
  }
  return docRef.id;
}

export async function fetchPriceAnalyses(db, clientId) {
  const collRef = collection(db, 'price_analyses');
  const q = query(collRef, where("clientId", "==", clientId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * ESTABLISHMENTS AND EMPLOYEES API
 */
export async function fetchEstablishments(db) {
  const cacheKey = 'establishments';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'establishments');
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

export async function saveEstablishment(db, establishment) {
  const collRef = collection(db, 'establishments');
  let docRef;
  const { id, ...data } = establishment;
  const dataToSave = { ...data, updatedAt: Date.now() };

  if (id) {
    docRef = doc(db, 'establishments', id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = Date.now();
    docRef = await addDoc(collRef, dataToSave);
  }
  return docRef.id;
}

export async function deleteEstablishment(db, id) {
  const docRef = doc(db, 'establishments', id);
  // Optional: We might also want to delete all employees in the subcollection, 
  // but usually Firebase requires a Cloud Function for recursive deletes or fetching and deleting each.
  // For simplicity, we just delete the parent doc here.
  await deleteDoc(docRef);
}

export async function fetchEmployees(db, establishmentId) {
  if (!establishmentId) throw new Error("establishmentId is required to fetch employees");
  const collRef = collection(db, 'establishments', establishmentId, 'employees');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveEmployee(db, establishmentId, employee) {
  if (!establishmentId) throw new Error("establishmentId is required to save an employee");
  const collRef = collection(db, 'establishments', establishmentId, 'employees');
  let docRef;
  const { id, ...data } = employee;
  const dataToSave = { ...data, updatedAt: Date.now() };

  if (id) {
    docRef = doc(db, 'establishments', establishmentId, 'employees', id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = Date.now();
    docRef = await addDoc(collRef, dataToSave);
  }
  return docRef.id;
}

export async function deleteEmployee(db, establishmentId, employeeId) {
  if (!establishmentId || !employeeId) throw new Error("establishmentId and employeeId are required");
  const docRef = doc(db, 'establishments', establishmentId, 'employees', employeeId);
  await deleteDoc(docRef);
}

/** Subscribe in real-time to travels collection */
export function subscribeToTravels(db, uid, callback, onError) {
  if (!uid) throw new Error("UID is required to subscribe to travels");
  const collRef = collection(db, 'travels');
  
  return onSnapshot(collRef, (snapshot) => {
    const travels = snapshot.docs.map(docSnap => {
      const dto = docSnap.data();
      try {
        const { data: rawData, updatedAt, createdAt, ...topLevelFields } = dto;
        if (rawData && typeof rawData === 'string') {
          const parsed = JSON.parse(rawData);
          return { ...topLevelFields, ...parsed, firebaseId: docSnap.id };
        }
        return { id: docSnap.id, ...dto };
      } catch (e) {
        console.warn(`Error parsing travel id ${docSnap.id}:`, e);
        return { id: docSnap.id, ...dto };
      }
    });
    callback(travels);
  }, onError);
}

/** Subscribe in real-time to check operations collection */
export function subscribeToCheckOperations(db, uid, callback, onError) {
  const collRef = collection(db, 'check_operations');
  return onSnapshot(collRef, (snapshot) => {
    const checks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(checks);
  }, onError);
}

/** Fetch a sale document by ID */
export async function fetchSaleById(db, saleId) {
  const docRef = doc(db, 'sales', saleId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/** Fetch all products from master_data */
export async function fetchProducts(db) {
  const cacheKey = 'master_data:PRODUCT';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'master_data');
  const q = query(collRef, where('type', '==', 'PRODUCT'));
  const snapshot = await getDocs(q);
  const result = snapshot.docs.map(docSnap => {
    const dto = docSnap.data();
    try {
      const { data: rawData, updatedAt, createdAt, ...topLevelFields } = dto;
      if (rawData && typeof rawData === 'string') {
        const parsed = JSON.parse(rawData);
        return { ...topLevelFields, ...parsed, firebaseId: docSnap.id };
      }
      return { id: docSnap.id, ...dto };
    } catch (e) {
      return { id: docSnap.id, ...dto };
    }
  });
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

/** Fetch raw material products from master_data */
export async function fetchRawMaterialProducts(db) {
  const cacheKey = 'master_data:RAW_MATERIAL_PRODUCT';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'master_data');
  const q = query(collRef, where('type', '==', 'RAW_MATERIAL_PRODUCT'));
  const snapshot = await getDocs(q);
  const result = snapshot.docs.map(docSnap => {
    const dto = docSnap.data();
    try {
      const { data: rawData, updatedAt, createdAt, ...topLevelFields } = dto;
      if (rawData && typeof rawData === 'string') {
        const parsed = JSON.parse(rawData);
        return { ...topLevelFields, ...parsed, firebaseId: docSnap.id };
      }
      return { id: docSnap.id, ...dto };
    } catch (e) {
      return { id: docSnap.id, ...dto };
    }
  });
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

/** Fetch all providers from proveedores collection */
export async function fetchProviders(db) {
  const cacheKey = 'proveedores';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'proveedores');
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  _setCached(cacheKey, result, TTL_5MIN);
  return result;
}

export async function saveProviderDirectly(db, providerRecord) {
  const docRef = doc(db, 'proveedores', String(providerRecord.id));
  await setDoc(docRef, { ...providerRecord, updatedAt: Date.now() });
  _invalidateCached('proveedores');
}

/** Save a raw material batch to frigorifico_entries collection */
export async function saveRawMaterialBatch(db, batch) {
  const docRef = doc(db, 'frigorifico_entries', `RAW_${batch.id}`);
  await setDoc(docRef, { ...batch, updatedAt: Date.now() });
}

/** Fetch all price lists from price_lists collection */
export async function fetchPriceLists(db) {
  const cacheKey = 'price_lists';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'price_lists');
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

/** Execute a unified dispatch committing all changes atomically in a single write batch */
export async function executeUnifiedDispatch(db, uid, {
  clientId,
  destName,
  priceListId,
  isNewClient,
  shouldLinkClient,
  providerToUpdate,
  isNewProvider,
  customerTransaction,
  providerTransaction,
  rawMaterialBatches,
  carcassesToUpdate
}) {
  const batch = writeBatch(db);

  // 1. Create or link client
  if (isNewClient) {
    const clientRef = doc(db, 'clientes', clientId);
    batch.set(clientRef, {
      name: destName,
      priceListId: priceListId || null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  } else if (shouldLinkClient && priceListId) {
    const clientRef = doc(db, 'clientes', clientId);
    batch.update(clientRef, { priceListId, updatedAt: Date.now() });
  }

  // 2. Save/Update provider
  const providerRef = doc(db, 'proveedores', String(providerToUpdate.id));
  if (isNewProvider) {
    batch.set(providerRef, {
      ...providerToUpdate,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  } else {
    batch.update(providerRef, {
      balance: providerToUpdate.balance,
      updatedAt: Date.now()
    });
  }

  // 3. Add customer transaction
  const custTxRef = doc(collection(db, 'transactions'));
  batch.set(custTxRef, { ...customerTransaction, createdAt: Date.now() });

  // 4. Add provider transaction
  if (providerTransaction) {
    const provTxRef = doc(collection(db, 'transactions'));
    batch.set(provTxRef, { ...providerTransaction, createdAt: Date.now() });
  }

  // 5. Save all raw material batches
  if (rawMaterialBatches && rawMaterialBatches.length > 0) {
    rawMaterialBatches.forEach(rmb => {
      const rmbRef = doc(db, 'frigorifico_entries', `RAW_${rmb.id}`);
      batch.set(rmbRef, { ...rmb, updatedAt: Date.now() });
    });
  }

  // 6. Update carcass statuses and history to DISPATCHED
  const now = Date.now();
  const deleteAt = new Date(now + 90 * 24 * 60 * 60 * 1000);

  carcassesToUpdate.forEach(c => {
    const carcassRef = doc(db, 'faenas_detalle', c.id);
    batch.update(carcassRef, {
      status: 'DISPATCHED',
      destination: destName,
      dispatchDate: now,
      movements: c.movements,
      updatedAt: now,
      deleteAt: deleteAt
    });
  });

  await batch.commit();

  // Write-Through Cache to Dexie for Clientes
  if (isNewClient) {
    await localDb.clientes.put({
      id: clientId,
      name: destName,
      priceListId: priceListId || null,
      createdAt: now,
      updatedAt: now
    });
  } else if (shouldLinkClient && priceListId) {
    const existing = await localDb.clientes.get(clientId);
    if (existing) {
      await localDb.clientes.put({
        ...existing,
        priceListId,
        updatedAt: now
      });
    }
  }

  // Write-Through Cache to Dexie for Carcasses
  for (const c of carcassesToUpdate) {
    const existing = await localDb.faenas_detalle.get(c.id);
    if (existing) {
      await localDb.faenas_detalle.put({
        ...existing,
        status: 'DISPATCHED',
        destination: destName,
        dispatchDate: now,
        movements: c.movements,
        updatedAt: now,
        deleteAt: deleteAt
      });
    }
  }

  invalidateRecentDispatchedCache();
  clientsCache = null; // Invalidate clients cache since we may have added a new client
}

/** Update category and history comments of a specific carcass item */
export async function updateFaenaCategory(db, id, category, comments) {
  const docRef = doc(db, 'faenas_detalle', id);
  const now = Date.now();
  const updateData = {
    category,
    standardizedCategory: category,
    comments,
    updatedAt: now
  };
  await updateDoc(docRef, updateData);

  // Write-Through Cache to Dexie
  const existing = await localDb.faenas_detalle.get(id);
  if (existing) {
    await localDb.faenas_detalle.put({
      ...existing,
      ...updateData
    });
  }

  invalidateRecentDispatchedCache();
}

/**
 * Reassign the destination of a dispatched carcass, adjusting the client debt transactions atomically.
 */
export async function updateCarcassDestination(db, uid, carcassId, newDestination, newPrice) {
  const carcass = await localDb.faenas_detalle.get(carcassId);
  if (!carcass) throw new Error("No se encontró la res en la base de datos local.");

  const oldDestination = carcass.destination;
  if (!oldDestination) throw new Error("Esta res no tiene un destino previo registrado.");

  const localClients = await localDb.clientes.toArray();
  
  // Find IDs for old and new clients
  const oldClient = localClients.find(c => c.name.toLowerCase() === oldDestination.toLowerCase());
  const oldClientId = oldClient ? oldClient.id : null;

  const matchedNewClient = localClients.find(c => c.name.toLowerCase() === newDestination.toLowerCase());
  const newClientId = matchedNewClient ? matchedNewClient.id : `CUST_${Date.now()}`;
  const isNewNewClient = !matchedNewClient;

  // Find the original debt transaction for the old client that contains this carcass
  let originalTx = null;
  const transColl = collection(db, 'transactions');

  if (oldClientId) {
    const q = query(transColl, where("clientId", "==", oldClientId), where("type", "==", "DEBT"));
    const txSnapshot = await getDocs(q);
    for (const docSnap of txSnapshot.docs) {
      const tx = docSnap.data();
      if (tx.breakout && tx.breakout.some(item => item.id === carcassId)) {
        originalTx = { id: docSnap.id, ...tx };
        break;
      }
    }
  }

  const batch = writeBatch(db);
  const now = Date.now();

  // Create new client if it doesn't exist
  if (isNewNewClient) {
    const clientRef = doc(db, 'clientes', newClientId);
    batch.set(clientRef, {
      name: newDestination,
      priceListId: null,
      createdAt: now,
      updatedAt: now
    });
  }

  // Adjust/Split/Move the transaction
  const itemTotal = carcass.kg * newPrice;
  const newTxBreakoutItem = {
    id: carcassId,
    garron: carcass.garron,
    weight: carcass.kg,
    price: newPrice,
    total: itemTotal
  };

  if (originalTx) {
    const remainingBreakout = (originalTx.breakout || []).filter(item => item.id !== carcassId);
    
    if (remainingBreakout.length > 0) {
      // Split transaction: Reduce original, create new one
      const oldItemTotal = (originalTx.breakout || []).find(item => item.id === carcassId)?.total || 0;
      const newOldAmount = Math.max(0, (originalTx.amount || 0) - oldItemTotal);
      
      const originalTxRef = doc(db, 'transactions', originalTx.id);
      batch.update(originalTxRef, {
        amount: newOldAmount,
        breakout: remainingBreakout,
        updatedAt: now
      });

      // Create new transaction for the new client
      const newTxRef = doc(transColl);
      batch.set(newTxRef, {
        clientId: newClientId,
        type: 'DEBT',
        amount: itemTotal,
        description: `Reasignado: Despacho de 1 res (Garrón #${carcass.garron}, ${carcass.kg.toFixed(1)} kg) a "${newDestination}" (Origen anterior: "${oldDestination}")`,
        breakout: [newTxBreakoutItem],
        date: now,
        createdAt: now,
        updatedAt: now
      });
    } else {
      // Only item: Re-assign entire transaction to the new client
      const originalTxRef = doc(db, 'transactions', originalTx.id);
      batch.update(originalTxRef, {
        clientId: newClientId,
        amount: itemTotal,
        description: `Reasignado: Despacho de 1 res (Garrón #${carcass.garron}, ${carcass.kg.toFixed(1)} kg) a "${newDestination}" (Origen anterior: "${oldDestination}")`,
        breakout: [newTxBreakoutItem],
        updatedAt: now
      });
    }
  } else {
    // No original transaction found: Just create a new one
    const newTxRef = doc(transColl);
    batch.set(newTxRef, {
      clientId: newClientId,
      type: 'DEBT',
      amount: itemTotal,
      description: `Reasignado: Despacho de 1 res (Garrón #${carcass.garron}, ${carcass.kg.toFixed(1)} kg) a "${newDestination}"`,
      breakout: [newTxBreakoutItem],
      date: now,
      createdAt: now,
      updatedAt: now
    });
  }

  // Update carcass destination and add to history
  const carcassRef = doc(db, 'faenas_detalle', carcassId);
  const updatedMovements = [...(carcass.movements || [])];
  updatedMovements.push({
    type: 'DESTINATION',
    from: oldDestination,
    to: newDestination,
    date: now,
    price: newPrice
  });

  const carcassUpdate = {
    destination: newDestination,
    movements: updatedMovements,
    updatedAt: now
  };
  batch.update(carcassRef, carcassUpdate);

  await batch.commit();

  // Write-Through to Dexie for New Client if added
  if (isNewNewClient) {
    await localDb.clientes.put({
      id: newClientId,
      name: newDestination,
      priceListId: null,
      createdAt: now,
      updatedAt: now
    });
  }

  // Write-Through to Dexie for carcass
  await localDb.faenas_detalle.put({
    ...carcass,
    ...carcassUpdate
  });

  _invalidateCached('transactions:all');
  clientsCache = null;
  invalidateRecentDispatchedCache();
}




