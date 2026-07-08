// src/api/OperatorApi.js
import { collection, getDocs, doc, updateDoc, addDoc, query, where } from 'firebase/firestore';
import { _getCached, _setCached, _invalidateCached, TTL_5MIN, TTL_10MIN } from './common.js';

/**
 * CHECK OPERATORS API
 */
export async function fetchOperators(db) {
  const cacheKey = 'check_operators';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'check_operators');
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

export async function saveOperator(db, operatorData) {
  if (operatorData.id) {
    const docRef = doc(db, 'check_operators', operatorData.id);
    await updateDoc(docRef, { ...operatorData, updatedAt: Date.now() });
    _invalidateCached('check_operators');
    return operatorData.id;
  } else {
    const collRef = collection(db, 'check_operators');
    const docRef = await addDoc(collRef, { ...operatorData, createdAt: Date.now() });
    _invalidateCached('check_operators');
    return docRef.id;
  }
}

export async function fetchOperatorTransactions(db, operatorId) {
  const collRef = collection(db, 'operator_transactions');
  const q = query(collRef, where("operatorId", "==", operatorId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function fetchAllOperatorTransactions(db) {
  const cacheKey = 'operator_transactions:all';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const collRef = collection(db, 'operator_transactions');
  const snapshot = await getDocs(collRef);
  const result = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  _setCached(cacheKey, result, TTL_5MIN);
  return result;
}

export async function addOperatorTransaction(db, transactionRecord) {
  const collRef = collection(db, 'operator_transactions');
  await addDoc(collRef, { ...transactionRecord, createdAt: Date.now() });
  _invalidateCached('operator_transactions:all');
}
