// src/api/ClientApi.js
import { collection, getDocs, getDoc, doc, updateDoc, setDoc, addDoc, query, where, limit } from 'firebase/firestore';
import { localDb } from '../../frameworks/db/localDb.js';
import { _getCached, _setCached, _invalidateCached, TTL_5MIN } from './common.js';

let clientsCache = null;
let categoryPricesCache = null;

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

/** Fetch a sale document by ID */
export async function fetchSaleById(db, saleId) {
  const docRef = doc(db, 'sales', saleId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}
