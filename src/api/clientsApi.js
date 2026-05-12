import { collection, getDocs, getDoc, doc, updateDoc, setDoc, addDoc, query, where, limit } from 'firebase/firestore';
import { logger } from '../utils/logger.js';

export async function fetchClients(db) {
  const collRef = collection(db, 'clientes');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function saveClient(db, clientRecord) {
  const collRef = collection(db, 'clientes');
  let clientRef;
  
  if (clientRecord.id) {
    clientRef = doc(db, 'clientes', clientRecord.id);
    await updateDoc(clientRef, { ...clientRecord, updatedAt: Date.now() });
  } else {
    const q = query(collRef, where("name", "==", clientRecord.name), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      clientRef = doc(db, 'clientes', snapshot.docs[0].id);
      await updateDoc(clientRef, { ...clientRecord, updatedAt: Date.now() });
    } else {
      const addedDoc = await addDoc(collRef, { ...clientRecord, createdAt: Date.now() });
      clientRef = addedDoc;
    }
  }
  return clientRef.id;
}

export async function fetchCategoryPrices(db) {
  const docRef = doc(db, 'config', 'prices');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.prices || data || {};
  }
  return {};
}

export async function saveCategoryPrices(db, pricesRecord) {
  const docRef = doc(db, 'config', 'prices');
  await setDoc(docRef, { prices: pricesRecord, updatedAt: Date.now() });
}

export async function fetchCamaras(db) {
  const docRef = doc(db, 'config', 'camaras');
  const docSnap = await getDoc(docRef);
  return docSnap.exists() && docSnap.data().list ? docSnap.data().list : [];
}

export async function saveCamaras(db, camarasList) {
  logger.info("api.saveCamaras called with:", camarasList);
  const docRef = doc(db, 'config', 'camaras');
  await setDoc(docRef, { list: camarasList, updatedAt: Date.now() });
  logger.info("api.saveCamaras successfully completed");
}
