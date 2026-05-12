import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { logger } from '../utils/logger.js';

async function fetchAndParseRootCollection(db, uid, collName) {
  if (!uid) throw new Error("UID is required to fetch data");
  const collRef = collection(db, collName);
  const snapshot = await getDocs(collRef);
  
  return snapshot.docs.map(docSnap => {
    const dto = docSnap.data();
    try {
      const { data: rawData, updatedAt, createdAt, ...topLevelFields } = dto;
      if (rawData && typeof rawData === 'string') {
        const parsed = JSON.parse(rawData);
        return { ...topLevelFields, ...parsed, firebaseId: docSnap.id };
      }
      return { id: docSnap.id, ...dto };
    } catch (e) {
      logger.warn(`Error parsing data for ${collName} id ${docSnap.id}:`, e);
      return { id: docSnap.id, ...dto };
    }
  });
}

export async function fetchTravels(db, uid) {
  return fetchAndParseRootCollection(db, uid, 'travels');
}

export async function fetchBuys(db, uid) {
  return fetchAndParseRootCollection(db, uid, 'buys');
}

export async function fetchTrucks(db, uid) {
  if (!uid) throw new Error("UID is required to fetch data");
  const collRef = collection(db, 'master_data');
  const q = query(collRef, where('type', '==', 'TRUCK'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
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
}

export async function fetchMasterData(db, uid, type) {
  if (!uid) throw new Error("UID is required to fetch data");
  const collRef = collection(db, 'master_data');
  const q = query(collRef, where('type', '==', type));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
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
}

export async function updateTravel(db, uid, travelId, travelObject) {
  if (!uid) throw new Error("UID is required to update data");
  const docRef = doc(db, 'travels', String(travelId));
  const dataToSave = {
    data: JSON.stringify(travelObject),
    updatedAt: Date.now()
  };
  await updateDoc(docRef, dataToSave);
}
