// webApp/src/api.js
import { collection, getDocs, doc, updateDoc, setDoc, addDoc, query, where, limit } from 'firebase/firestore';

/** Helper to fetch and parse a root collection */
async function fetchAndParseRootCollection(db, uid, collName) {
  if (!uid) throw new Error("UID is required to fetch data");
  const collRef = collection(db, collName);
  const snapshot = await getDocs(collRef);
  
  return snapshot.docs.map(docSnap => {
    const dto = docSnap.data();
    try {
      // The domain object is stored as a JSON string in the 'data' field
      if (dto.data && typeof dto.data === 'string') {
        return { ...JSON.parse(dto.data), firebaseId: docSnap.id };
      }
      return { id: docSnap.id, ...dto };
    } catch (e) {
      console.warn(`Error parsing data for ${collName} id ${docSnap.id}:`, e);
      return { id: docSnap.id, ...dto };
    }
  });
}

export async function fetchTravels(db, uid) {
  return fetchAndParseRootCollection(db, uid, 'travels');
}

export async function fetchBuys(db, uid) {
  // Buys are usually part of travels, but if they are separate:
  return fetchAndParseRootCollection(db, uid, 'buys');
}

export async function fetchTrucks(db, uid) {
  const masterData = await fetchAndParseRootCollection(db, uid, 'master_data');
  // MasterDataFirebaseDto has a 'type' field and the 'data' field is already parsed in fetchAndParseRootCollection
  return masterData.filter(item => item.type === 'TRUCK' || (item.licensePlate && !item.type));
}

/** Fetch master data of a specific type (AGENT, DRIVER, etc.) */
export async function fetchMasterData(db, uid, type) {
  const all = await fetchAndParseRootCollection(db, uid, 'master_data');
  return all.filter(item => item.type === type);
}

/** 
 * Update a travel document. 
 * Since the original structure stores a JSON string in 'data', we wrap it back.
 */
export async function updateTravel(db, uid, travelId, travelObject) {
  if (!uid) throw new Error("UID is required to update data");
  const docRef = doc(db, 'travels', travelId);
  const dataToSave = {
    data: JSON.stringify(travelObject),
    updatedAt: Date.now()
  };
  await updateDoc(docRef, dataToSave);
}

/**
 * Save detailed faena/carcass data for a specific travel.
 */
export async function saveFaenaDetalle(db, uid, faenaRecords) {
  if (!uid) throw new Error("UID is required to save details");
  const collRef = collection(db, 'faenas_detalle');
  // Using a batch or sequential adds. For simplicity, sequential for now.
  const promises = faenaRecords.map(record => {
    return addDoc(collRef, {
      ...record,
      ownerUid: uid,
      createdAt: Date.now()
    });
  });
  await Promise.all(promises);
}

/**
 * Check if a faena PDF was already processed by searching its filename in the details collection.
 */
export async function checkIfFaenaExists(db, uid, fileName) {
  if (!uid) return false;
  const collRef = collection(db, 'faenas_detalle');
  const q = query(collRef, where("ownerUid", "==", uid), where("fileName", "==", fileName), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Fetch all faena details for a specific user to build the Stock and History views.
 */
export async function fetchFaenaDetalle(db, uid) {
  if (!uid) throw new Error("UID is required");
  const collRef = collection(db, 'faenas_detalle');
  const q = query(collRef, where("ownerUid", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update the status of multiple faena detail records (e.g., to DISPATCHED).
 */
export async function updateFaenasStatus(db, uid, recordIds, updateData) {
  if (!uid || !recordIds || recordIds.length === 0) return;
  // Doing sequential updates for now. For large arrays, a WriteBatch is better.
  const promises = recordIds.map(id => {
    const docRef = doc(db, 'faenas_detalle', id);
    return updateDoc(docRef, updateData);
  });
  await Promise.all(promises);
}
