// src/api/LogisticsApi.js
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

const MASTER_DATA_COLLECTION = 'master_data';
const TRAVELS_COLLECTION = 'travels';

function getUserId() {
  return auth.currentUser ? auth.currentUser.uid : 'unknown_user';
}

/**
 * Parses the stringified 'data' field from a Firebase document.
 */
function parseData(docSnapshot) {
  const docData = docSnapshot.data();
  if (!docData || !docData.data) return null;
  try {
    return JSON.parse(docData.data);
  } catch (e) {
    console.error(`Error parsing data for doc ${docSnapshot.id}:`, e);
    return null;
  }
}

/**
 * Creates the payload for Master Data
 */
function createMasterDataPayload(id, type, domainObject) {
  return {
    id: `${type}_${id}`,
    type: type,
    updatedAt: Date.now(),
    userId: getUserId(),
    data: JSON.stringify(domainObject)
  };
}

/**
 * Creates the payload for Travels
 */
function createTravelPayload(domainObject) {
  return {
    id: String(domainObject.id),
    updatedAt: Date.now(),
    userId: getUserId(),
    data: JSON.stringify(domainObject)
  };
}

// -- MASTER DATA (Drivers, Trailers, Trucks, Config) --

export async function fetchMasterDataByType(type) {
  const colRef = collection(db, MASTER_DATA_COLLECTION);
  const snapshot = await getDocs(colRef);
  const results = [];
  snapshot.forEach(docSnap => {
    const firestoreData = docSnap.data();
    if (firestoreData.type === type) {
      const parsed = parseData(docSnap);
      if (parsed) results.push(parsed);
    }
  });
  return results;
}

export async function fetchDrivers() {
  return fetchMasterDataByType('DRIVER');
}

export async function fetchTrailers() {
  return fetchMasterDataByType('TRAILER');
}

export async function fetchTrucks() {
  return fetchMasterDataByType('TRUCK');
}

export async function saveMasterData(id, type, domainObject) {
  const docId = `${type}_${id}`;
  const payload = createMasterDataPayload(id, type, domainObject);
  await setDoc(doc(db, MASTER_DATA_COLLECTION, docId), payload);
  return domainObject;
}

export async function deleteMasterData(id, type) {
  const docId = `${type}_${id}`;
  await deleteDoc(doc(db, MASTER_DATA_COLLECTION, docId));
}

// -- CONFIGURATION --

export async function getAppConfig() {
  const docRef = doc(db, MASTER_DATA_COLLECTION, 'APP_CONFIG_default');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const config = parseData(docSnap);
    if (config) return config;
  }
  // Return default values if not found
  return {
    id: 'default',
    defaultDriverPricePerKmSimple: 150.0,
    defaultDriverPricePerKmDouble: 200.0,
    defaultFreightPricePerKm: 500.0,
    fuelPrice: 1000.0,
    simulationFreightPriceSimple: 2500.0,
    simulationFreightPriceDouble: 3100.0
  };
}

// -- TRAVELS --

export async function fetchTravels() {
  const colRef = collection(db, TRAVELS_COLLECTION);
  const snapshot = await getDocs(colRef);
  const results = [];
  snapshot.forEach(docSnap => {
    const parsed = parseData(docSnap);
    if (parsed) results.push(parsed);
  });
  return results;
}

export async function saveTravel(domainObject) {
  const payload = createTravelPayload(domainObject);
  await setDoc(doc(db, TRAVELS_COLLECTION, payload.id), payload);
  return domainObject;
}

export async function deleteTravel(id) {
  await deleteDoc(doc(db, TRAVELS_COLLECTION, String(id)));
}
