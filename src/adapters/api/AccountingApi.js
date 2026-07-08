/**
 * @file AccountingApi.js
 * @description Proveedor de servicios y consultas Firebase Firestore para el libro contable de asientos de caja.
 * @module adapters/api/AccountingApi
 */
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';

/**
 * Obtiene todos los asientos contables asociados al usuario.
 * @param {Object} db - Instancia de Firestore.
 * @param {string} uid - Identificador de usuario.
 * @param {string} [collectionName='accounting_entries'] - Nombre de la colección contable.
 * @returns {Promise<Array<Object>>} Lista de asientos ordenados.
 */
export async function fetchAccountingEntries(db, uid, collectionName = 'accounting_entries') {
  if (!uid) throw new Error("UID is required to fetch accounting entries");
  const collRef = collection(db, collectionName);
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b.date || b.createdAt || 0) - (a.date || a.createdAt || 0));
}

export async function saveAccountingEntry(db, uid, entry, collectionName = 'accounting_entries') {
  if (!uid) throw new Error("UID is required to save an accounting entry");
  const collRef = collection(db, collectionName);
  let docRef;
  const { id, ...data } = entry;
  const dataToSave = { ...data, ownerUid: uid, updatedAt: Date.now() };

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
    // Update existing
    const transDocId = snapshot.docs[0].id;
    await updateDoc(doc(db, 'transactions', transDocId), { 
      ...transactionData, 
      updatedAt: Date.now() 
    });
  } else {
    // Create new
    await addDoc(transColl, { 
      ...transactionData, 
      accountingEntryId, 
      createdAt: Date.now() 
    });
  }
}
