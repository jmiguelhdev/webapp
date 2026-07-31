/**
 * @file AccountingApi.js
 * @description Proveedor de servicios y consultas Firebase Firestore para el libro contable de asientos de caja.
 * @module adapters/api/AccountingApi
 */
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { localDb } from '../../frameworks/db/localDb.js';

/**
 * Obtiene los asientos contables desde IndexedDB.
 */
export async function getLocalAccountingEntries(collectionName) {
  try {
    const entries = await localDb.accounting_entries
      .where('collectionName').equals(collectionName)
      .toArray();
    return entries.sort((a, b) => (b.date || b.createdAt || 0) - (a.date || a.createdAt || 0));
  } catch (e) {
    console.error(`Error al leer asientos locales para ${collectionName}:`, e);
    return [];
  }
}

/**
 * Obtiene todos los asientos contables asociados al usuario.
 * @param {Object} db - Instancia de Firestore.
 * @param {string} uid - Identificador de usuario.
 * @param {string} [collectionName='accounting_entries'] - Nombre de la colección contable.
 * @returns {Promise<Array<Object>>} Lista de asientos ordenados.
 */
export async function fetchAccountingEntries(db, uid, collectionName = 'accounting_entries') {
  return getLocalAccountingEntries(collectionName);
}

export async function saveAccountingEntry(db, uid, entry, collectionName = 'accounting_entries') {
  if (!uid) throw new Error("UID is required to save an accounting entry");
  const collRef = collection(db, collectionName);
  let docRef;
  const { id, ...data } = entry;
  const now = Date.now();
  const dataToSave = { ...data, ownerUid: uid, updatedAt: now };

  let finalId = id;
  if (id) {
    docRef = doc(db, collectionName, id);
    await updateDoc(docRef, dataToSave);
  } else {
    dataToSave.createdAt = now;
    docRef = await addDoc(collRef, dataToSave);
    finalId = docRef.id;
  }

  // Escribir en caché local IndexedDB (Write-Through)
  try {
    await localDb.accounting_entries.put({
      id: finalId,
      collectionName: collectionName,
      createdAt: dataToSave.createdAt || now,
      ...dataToSave
    });
  } catch (errDb) {
    console.warn("[AccountingApi] Error escribiendo asiento contable local:", errDb);
  }

  return finalId;
}

export async function deleteAccountingEntry(db, entryId, collectionName = 'accounting_entries') {
  const docRef = doc(db, collectionName, entryId);
  await deleteDoc(docRef);

  // Eliminar en caché local IndexedDB
  try {
    await localDb.accounting_entries.delete(entryId);
  } catch (errDb) {
    console.warn("[AccountingApi] Error eliminando asiento contable local:", errDb);
  }
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
