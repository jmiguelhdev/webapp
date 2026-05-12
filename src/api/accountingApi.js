import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { logger } from '../utils/logger.js';

export async function fetchAccountingEntries(db, uid, collectionName = 'accounting_entries') {
  const collRef = collection(db, collectionName);
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function saveAccountingEntry(db, uid, entry, collectionName = 'accounting_entries') {
  if (!uid) throw new Error("UID is required to save accounting");
  const collRef = collection(db, collectionName);
  let docRef;
  
  const { id, ...entryData } = entry;
  const dataToSave = {
    ...entryData,
    ownerUid: uid,
    updatedAt: Date.now()
  };

  if (id) {
    docRef = doc(db, collectionName, id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = Date.now();
    docRef = await addDoc(collRef, dataToSave);
  }
  return docRef.id;
}

export async function deleteAccountingEntry(db, entryId, collectionName = 'accounting_entries') {
  const docRef = doc(db, collectionName, entryId);
  await deleteDoc(docRef);
  await removeLinkedTransaction(db, entryId);
}

export async function removeLinkedTransaction(db, accountingEntryId) {
  const transColl = collection(db, 'transactions');
  const q = query(transColl, where("accountingEntryId", "==", accountingEntryId));
  const snapshot = await getDocs(q);
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'transactions', docSnap.id));
  }
}

export async function syncAccountingToTransaction(db, accountingEntryId, transactionData) {
  const transColl = collection(db, 'transactions');
  const q = query(transColl, where("accountingEntryId", "==", accountingEntryId));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const transDocId = snapshot.docs[0].id;
    await updateDoc(doc(db, 'transactions', transDocId), { 
      ...transactionData, 
      updatedAt: Date.now() 
    });
  } else {
    await addDoc(transColl, { 
      ...transactionData, 
      accountingEntryId, 
      createdAt: Date.now() 
    });
  }
}

export async function fetchTransactions(db, clientId) {
  const collRef = collection(db, 'transactions');
  const q = query(collRef, where("clientId", "==", clientId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function fetchAllTransactions(db) {
  const collRef = collection(db, 'transactions');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function addTransaction(db, transactionRecord) {
  const collRef = collection(db, 'transactions');
  await addDoc(collRef, { ...transactionRecord, createdAt: Date.now() });
}

export async function fetchTransactionsInRange(db, clientId, startDate, endDate) {
  const collRef = collection(db, 'transactions');
  let q = query(collRef, where("clientId", "==", clientId));
  
  const snapshot = await getDocs(q);
  let txs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
    const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
    txs = txs.filter(t => {
      const d = t.date || t.createdAt;
      return d >= start && d <= end;
    });
  }
  return txs;
}

export async function savePriceAnalysis(db, analysis) {
  const collRef = collection(db, 'price_analyses');
  let docRef;
  const { id, ...data } = analysis;
  const dataToSave = { ...data, updatedAt: Date.now() };

  if (id) {
    docRef = doc(db, 'price_analyses', id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = Date.now();
    docRef = await addDoc(collRef, dataToSave);
  }
  return docRef.id;
}

export async function fetchPriceAnalyses(db, clientId) {
  const collRef = collection(db, 'price_analyses');
  const q = query(collRef, where("clientId", "==", clientId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
