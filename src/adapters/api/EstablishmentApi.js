// src/api/EstablishmentApi.js
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { _getCached, _setCached, _invalidateCached, TTL_10MIN } from './common.js';

/**
 * ESTABLISHMENTS AND EMPLOYEES API
 */
export async function fetchEstablishments(db) {
  const cacheKey = 'establishments';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'establishments');
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

export async function saveEstablishment(db, establishment) {
  const collRef = collection(db, 'establishments');
  let docRef;
  const { id, ...data } = establishment;
  const dataToSave = { ...data, updatedAt: Date.now() };

  if (id) {
    docRef = doc(db, 'establishments', id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = Date.now();
    docRef = await addDoc(collRef, dataToSave);
  }
  _invalidateCached('establishments');
  return docRef.id;
}

export async function deleteEstablishment(db, id) {
  const docRef = doc(db, 'establishments', id);
  await deleteDoc(docRef);
  _invalidateCached('establishments');
}

export async function fetchEmployees(db, establishmentId) {
  if (!establishmentId) throw new Error("establishmentId is required to fetch employees");
  const collRef = collection(db, 'establishments', establishmentId, 'employees');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveEmployee(db, establishmentId, employee) {
  if (!establishmentId) throw new Error("establishmentId is required to save an employee");
  const collRef = collection(db, 'establishments', establishmentId, 'employees');
  let docRef;
  const { id, ...data } = employee;
  const dataToSave = { ...data, updatedAt: Date.now() };

  if (id) {
    docRef = doc(db, 'establishments', establishmentId, 'employees', id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = Date.now();
    docRef = await addDoc(collRef, dataToSave);
  }
  return docRef.id;
}

export async function deleteEmployee(db, establishmentId, employeeId) {
  if (!establishmentId || !employeeId) throw new Error("establishmentId and employeeId are required");
  const docRef = doc(db, 'establishments', establishmentId, 'employees', employeeId);
  await deleteDoc(docRef);
}
