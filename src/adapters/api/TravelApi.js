// src/api/TravelApi.js
import { collection, getDocs, doc, updateDoc, setDoc, query, where, deleteDoc, onSnapshot } from 'firebase/firestore';
import { localDb } from '../../frameworks/db/localDb.js';
import { _getCached, _setCached, _invalidateCached, TTL_5MIN, TTL_10MIN, parseFirestoreDoc, fetchAndParseRootCollection } from './common.js';

export async function fetchTravels(db, uid) {
  return localDb.travels.toArray();
}

export async function fetchBuys(db, uid) {
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
  const result = snapshot.docs.map(docSnap => parseFirestoreDoc(docSnap)).filter(Boolean);
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
  const result = snapshot.docs.map(docSnap => parseFirestoreDoc(docSnap)).filter(Boolean);
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

/** 
 * Update a travel document. 
 * Stores both the native JSON properties and the stringified 'data' field
 * for backward compatibility with mobile and legacy web clients.
 */
export async function updateTravel(db, uid, travelId, travelObject) {
  if (!uid) throw new Error("UID is required to update data");
  const docRef = doc(db, 'travels', String(travelId));
  const dataToSave = {
    ...JSON.parse(JSON.stringify(travelObject)),
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
  const cleanTravel = JSON.parse(JSON.stringify(travelObject));
  const dataToSave = {
    ...cleanTravel,
    data: JSON.stringify(travelObject),
    updatedAt: Date.now()
  };
  if (!dataToSave.createdAt) {
    dataToSave.createdAt = Date.now();
  }
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

/** Subscribe in real-time to travels collection */
export function subscribeToTravels(db, uid, callback, onError) {
  if (!uid) throw new Error("UID is required to subscribe to travels");
  const collRef = collection(db, 'travels');
  
  return onSnapshot(collRef, (snapshot) => {
    const travels = snapshot.docs.map(docSnap => parseFirestoreDoc(docSnap)).filter(Boolean);
    callback(travels);
  }, onError);
}

/** Fetch all products from master_data */
export async function fetchProducts(db) {
  const cacheKey = 'master_data:PRODUCT';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'master_data');
  const q = query(collRef, where('type', '==', 'PRODUCT'));
  const snapshot = await getDocs(q);
  const result = snapshot.docs.map(docSnap => parseFirestoreDoc(docSnap)).filter(Boolean);
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
  const result = snapshot.docs.map(docSnap => parseFirestoreDoc(docSnap)).filter(Boolean);
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
