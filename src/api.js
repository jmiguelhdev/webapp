// webApp/src/api.js
import { collection, getDocs, doc } from 'firebase/firestore';

/** Helper to fetch and parse a collection under a specific user document */
async function fetchAndParseUserCollection(db, uid, collName) {
  if (!uid) throw new Error("UID is required to fetch user data");
  const userDocRef = doc(db, 'users', uid);
  const collRef = collection(userDocRef, collName);
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
  return fetchAndParseUserCollection(db, uid, 'travels');
}

export async function fetchBuys(db, uid) {
  // Buys are usually part of travels, but if they are separate:
  return fetchAndParseUserCollection(db, uid, 'buys');
}

export async function fetchTrucks(db, uid) {
  const masterData = await fetchAndParseUserCollection(db, uid, 'master_data');
  // MasterDataFirebaseDto has a 'type' field and the 'data' field is already parsed in fetchAndParseUserCollection
  return masterData.filter(item => item.type === 'TRUCK' || (item.licensePlate && !item.type));
}

/** Fetch master data of a specific type (AGENT, DRIVER, etc.) */
export async function fetchMasterData(db, uid, type) {
  const all = await fetchAndParseUserCollection(db, uid, 'master_data');
  return all.filter(item => item.type === type);
}
