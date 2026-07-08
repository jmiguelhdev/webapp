// src/api/FaenaApi.js
import { collection, getDocs, getDoc, doc, updateDoc, setDoc, addDoc, query, where, limit, arrayUnion, writeBatch, onSnapshot } from 'firebase/firestore';
import { localDb } from '../db/localDb.js';
import { _getCached, _setCached, _invalidateCached, TTL_5MIN } from './common.js';
import { invalidateClientCache } from './ClientApi.js';

let activeFaenasCache = null;
let activeFaenasListenerUnsubscribe = null;
let activeFaenasPromise = null;

let camarasCache = null;

// Cache for recent dispatched faenas (valid for 2 minutes to reduce clicks overhead)
let recentDispatchedCache = null;
let recentDispatchedCacheTime = 0;
const RECENT_DISPATCHED_CACHE_DURATION = 2 * 60 * 1000; 

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
  invalidateClientCache(); // Invalidate clients cache since we may have added a new client
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
  invalidateClientCache();
  invalidateRecentDispatchedCache();
}
