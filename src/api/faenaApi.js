import { collection, getDocs, doc, updateDoc, setDoc, addDoc, query, where, limit, arrayUnion, writeBatch } from 'firebase/firestore';
import { logger } from '../utils/logger.js';

export async function saveFaenaDetalle(db, uid, faenaRecords) {
  if (!uid) throw new Error("UID is required to save details");
  const collRef = collection(db, 'faenas_detalle');
  const batch = writeBatch(db);
  
  faenaRecords.forEach(record => {
    const newDocRef = doc(collRef);
    batch.set(newDocRef, {
      ...record,
      ownerUid: uid,
      createdAt: Date.now()
    });
  });
  
  await batch.commit();
}

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

export async function fetchFaenaDetalle(db, uid) {
  const collRef = collection(db, 'faenas_detalle');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function updateFaenasStatus(db, uid, recordIds, updateData) {
  if (!uid || !recordIds || recordIds.length === 0) return;
  const batch = writeBatch(db);
  
  recordIds.forEach(id => {
    const docRef = doc(db, 'faenas_detalle', id);
    batch.update(docRef, updateData);
  });
  
  await batch.commit();
}

export async function fetchDispatchedFaenasInRange(db, clientName, startDate, endDate) {
  const collRef = collection(db, 'faenas_detalle');
  const q = query(
    collRef, 
    where("status", "==", "DISPATCHED"), 
    where("destination", "==", clientName)
  );
  
  const snapshot = await getDocs(q);
  let faenas = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
    const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
    faenas = faenas.filter(f => f.dispatchDate >= start && f.dispatchDate <= end);
  }
  
  return faenas;
}

export async function moveFaenasToCamara(db, uid, recordsInfo, camaraId) {
  if (!uid || !recordsInfo || recordsInfo.length === 0) return;
  const now = Date.now();
  const batch = writeBatch(db);
  
  recordsInfo.forEach(info => {
    const docRef = doc(db, 'faenas_detalle', info.id);
    const movement = { from: info.fromCamaraId || null, to: camaraId, date: now };
    batch.update(docRef, {
      camaraId: camaraId,
      movements: arrayUnion(movement)
    });
  });
  
  await batch.commit();
}

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
}

export async function fetchAchurasStock(db, uid) {
  const collRef = collection(db, 'achuras_stock');
  const snapshot = await getDocs(collRef);
  const docs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  return docs.filter(d => d.availableQuantity > 0).sort((a, b) => (a.date || 0) - (b.date || 0));
}

export async function consumeAchuras(db, uid, quantityToConsume) {
  if (!uid) throw new Error("UID is required to consume achuras");
  
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
}
