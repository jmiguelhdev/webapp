// src/api/CheckApi.js
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { localDb } from '../../frameworks/db/localDb.js';

export async function getLocalCheckOperations() {
  try {
    const checks = await localDb.check_operations.toArray();
    return checks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (e) {
    console.error("Error al leer cheques locales:", e);
    return [];
  }
}

export async function fetchCheckOperations(db, uid) {
  return getLocalCheckOperations();
}

export async function saveCheckOperation(db, uid, operation) {
  if (!uid) throw new Error("UID is required to save check operation");
  const collRef = collection(db, 'check_operations');
  let docRef;
  const { id, ...data } = operation;
  const now = Date.now();
  const dataToSave = { ...data, ownerUid: uid, updatedAt: now };

  let finalId = id;
  if (id) {
    docRef = doc(db, 'check_operations', id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = now;
    docRef = await addDoc(collRef, dataToSave);
    finalId = docRef.id;
  }

  // Escribir en IndexedDB (Write-Through)
  try {
    await localDb.check_operations.put({
      id: finalId,
      createdAt: dataToSave.createdAt || now,
      ...dataToSave
    });
  } catch (errDb) {
    console.warn("[CheckApi] Error escribiendo cheque local:", errDb);
  }

  return finalId;
}

export async function deleteCheckOperation(db, operationId) {
  const docRef = doc(db, 'check_operations', operationId);
  await deleteDoc(docRef);

  // Eliminar en IndexedDB
  try {
    await localDb.check_operations.delete(operationId);
  } catch (errDb) {
    console.warn("[CheckApi] Error eliminando cheque local:", errDb);
  }
}

/** Stub subscribe method to match the legacy signature, returns a dummy unsubscribe */
export function subscribeToCheckOperations(db, uid, callback, onError) {
  console.log("[CheckApi] subscribeToCheckOperations is now a Local-First stub.");
  getLocalCheckOperations().then(callback).catch(onError);
  return () => {};
}
