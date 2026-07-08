// src/api/CheckApi.js
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export async function fetchCheckOperations(db, uid) {
  if (!uid) throw new Error("UID is required to fetch check operations");
  const collRef = collection(db, 'check_operations');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function saveCheckOperation(db, uid, operation) {
  if (!uid) throw new Error("UID is required to save check operation");
  const collRef = collection(db, 'check_operations');
  let docRef;
  const { id, ...data } = operation;
  const dataToSave = { ...data, ownerUid: uid, updatedAt: Date.now() };

  if (id) {
    docRef = doc(db, 'check_operations', id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = Date.now();
    docRef = await addDoc(collRef, dataToSave);
  }
  return docRef.id;
}

export async function deleteCheckOperation(db, operationId) {
  const docRef = doc(db, 'check_operations', operationId);
  await deleteDoc(docRef);
}

/** Subscribe in real-time to check operations collection */
export function subscribeToCheckOperations(db, uid, callback, onError) {
  const collRef = collection(db, 'check_operations');
  return onSnapshot(collRef, (snapshot) => {
    const checks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(checks);
  }, onError);
}
