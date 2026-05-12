import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { logger } from '../utils/logger.js';

export async function fetchOperators(db) {
  const collRef = collection(db, 'check_operators');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function saveOperator(db, operatorData) {
  if (operatorData.id) {
    const docRef = doc(db, 'check_operators', operatorData.id);
    await updateDoc(docRef, { ...operatorData, updatedAt: Date.now() });
    return operatorData.id;
  } else {
    const collRef = collection(db, 'check_operators');
    const docRef = await addDoc(collRef, { ...operatorData, createdAt: Date.now() });
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
  const collRef = collection(db, 'operator_transactions');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function addOperatorTransaction(db, transactionRecord) {
  const collRef = collection(db, 'operator_transactions');
  await addDoc(collRef, { ...transactionRecord, createdAt: Date.now() });
}

export async function syncTransactionByCheck(db, collectionName, checkId, side, transactionData) {
  const collRef = collection(db, collectionName);
  const q = query(collRef, where("checkId", "==", checkId), where("checkSide", "==", side));
  const snapshot = await getDocs(q);
  
  if (!transactionData) {
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, collectionName, docSnap.id));
    }
    return;
  }
  
  if (!snapshot.empty) {
    const docRef = doc(db, collectionName, snapshot.docs[0].id);
    await updateDoc(docRef, { ...transactionData, updatedAt: Date.now() });
  } else {
    await addDoc(collRef, { ...transactionData, checkId, checkSide: side, createdAt: Date.now() });
  }
}

export async function fetchCheckOperations(db, uid) {
  const collRef = collection(db, 'check_operations');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function saveCheckOperation(db, uid, operation) {
  if (!uid) throw new Error("UID is required to save checks");
  const collRef = collection(db, 'check_operations');
  let docRef;
  
  const { id, ...operationData } = operation;
  const dataToSave = {
    ...operationData,
    ownerUid: uid,
    updatedAt: Date.now()
  };

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
