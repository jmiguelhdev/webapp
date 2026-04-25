// webApp/src/api.js
import { collection, getDocs, getDoc, doc, updateDoc, setDoc, addDoc, query, where, limit, arrayUnion, writeBatch, deleteDoc } from 'firebase/firestore';

/** Helper to fetch and parse a root collection */
async function fetchAndParseRootCollection(db, uid, collName) {
  if (!uid) throw new Error("UID is required to fetch data");
  const collRef = collection(db, collName);
  const snapshot = await getDocs(collRef);
  
  return snapshot.docs.map(docSnap => {
    const dto = docSnap.data();
    
    try {
      // The domain object may be stored as a JSON string in the 'data' field.
      // BUT some fields like 'reduce' live at the TOP LEVEL of the Firestore document.
      // We must merge both: top-level fields FIRST, then parsed 'data' overrides them,
      // so that structured domain properties win over any stale top-level copies.
      const { data: rawData, updatedAt, createdAt, ...topLevelFields } = dto;
      if (rawData && typeof rawData === 'string') {
        const parsed = JSON.parse(rawData);
        // Top-level fields fill in any gaps not covered by the parsed 'data' object.
        // e.g. { reduce: 13800000 } at root merged with parsed buy/producers/etc.
        return { ...topLevelFields, ...parsed, firebaseId: docSnap.id };
      }
      return { id: docSnap.id, ...dto };
    } catch (e) {
      console.warn(`Error parsing data for ${collName} id ${docSnap.id}:`, e);
      return { id: docSnap.id, ...dto };
    }
  });
}

export async function fetchTravels(db, uid) {
  return fetchAndParseRootCollection(db, uid, 'travels');
}

export async function fetchBuys(db, uid) {
  // Buys are usually part of travels, but if they are separate:
  return fetchAndParseRootCollection(db, uid, 'buys');
}

export async function fetchTrucks(db, uid) {
  const masterData = await fetchAndParseRootCollection(db, uid, 'master_data');
  // MasterDataFirebaseDto has a 'type' field and the 'data' field is already parsed in fetchAndParseRootCollection
  return masterData.filter(item => item.type === 'TRUCK' || (item.licensePlate && !item.type));
}

/** Fetch master data of a specific type (AGENT, DRIVER, etc.) */
export async function fetchMasterData(db, uid, type) {
  const all = await fetchAndParseRootCollection(db, uid, 'master_data');
  return all.filter(item => item.type === type);
}

/** 
 * Update a travel document. 
 * Since the original structure stores a JSON string in 'data', we wrap it back.
 */
export async function updateTravel(db, uid, travelId, travelObject) {
  if (!uid) throw new Error("UID is required to update data");
  const docRef = doc(db, 'travels', String(travelId)); // Always string for Firestore
  const dataToSave = {
    data: JSON.stringify(travelObject),
    updatedAt: Date.now()
  };
  await updateDoc(docRef, dataToSave);
}

/**
 * Save detailed faena/carcass data for a specific travel.
 */
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

/**
 * Check if a faena PDF was already processed by searching its filename in the details collection.
 */
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

/**
 * Fetch all faena details for a specific user to build the Stock and History views.
 */
export async function fetchFaenaDetalle(db, uid) {
  const collRef = collection(db, 'faenas_detalle');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update the status of multiple faena detail records (e.g., to DISPATCHED).
 */
export async function updateFaenasStatus(db, uid, recordIds, updateData) {
  if (!uid || !recordIds || recordIds.length === 0) return;
  const batch = writeBatch(db);
  
  recordIds.forEach(id => {
    const docRef = doc(db, 'faenas_detalle', id);
    batch.update(docRef, updateData);
  });
  
  await batch.commit();
}

/**
 * Fetch dispatched faenas for a client in a date range.
 */
export async function fetchDispatchedFaenasInRange(db, clientName, startDate, endDate) {
  const collRef = collection(db, 'faenas_detalle');
  const q = query(
    collRef, 
    where("status", "==", "DISPATCHED"), 
    where("destination", "==", clientName)
  );
  
  const snapshot = await getDocs(q);
  let faenas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
    const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
    faenas = faenas.filter(f => f.dispatchDate >= start && f.dispatchDate <= end);
  }
  
  return faenas;
}

/**
 * Move faenas to another camera, recording the event in the history.
 */
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

/**
 * ACHURAS STOCK API
 */
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
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return docs.filter(d => d.availableQuantity > 0).sort((a, b) => (a.date || 0) - (b.date || 0));
}

export async function consumeAchuras(db, uid, quantityToConsume) {
  if (!uid) throw new Error("UID is required to consume achuras");
  
  // Fetch available batches sorted by date (FIFO)
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

/** 
 * CLIENTS API
 */
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
    // Check if client with same name already exists to avoid duplicates
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

/**
 * CONFIG API (Prices by Category)
 */
export async function fetchCategoryPrices(db) {
  const docRef = doc(db, 'config', 'prices');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Return the nested prices object if it exists, otherwise the whole object for backward compatibility
    return data.prices || data || {};
  }
  return {};
}

export async function saveCategoryPrices(db, pricesRecord) {
  const docRef = doc(db, 'config', 'prices');
  await setDoc(docRef, { prices: pricesRecord, updatedAt: Date.now() });
}

/**
 * CONFIG API (Camaras de Frio)
 */
export async function fetchCamaras(db) {
  const docRef = doc(db, 'config', 'camaras');
  const docSnap = await getDoc(docRef);
  return docSnap.exists() && docSnap.data().list ? docSnap.data().list : [];
}

export async function saveCamaras(db, camarasList) {
  console.log("api.saveCamaras called with:", camarasList);
  const docRef = doc(db, 'config', 'camaras');
  await setDoc(docRef, { list: camarasList, updatedAt: Date.now() });
  console.log("api.saveCamaras successfully completed");
}

/**
 * USER PERMISSIONS API (RBAC)
 */
export async function fetchUserRole(db, user) {
  if (!user || !user.uid) return 'VISOR';
  const docRef = doc(db, 'user_metadata', user.uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    let updates = {};
    if (user.uid === 'iqy12KgqiDU0Z1QwwbqRSqvSpCM2' && data.role !== 'ADMIN') {
      updates.role = 'ADMIN';
    }
    if (!data.email && user.email) {
      updates.email = user.email;
    }
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = Date.now();
      await setDoc(docRef, updates, { merge: true });
    }
    return updates.role || data.role || 'VISOR';
  }
  
  const role = user.uid === 'iqy12KgqiDU0Z1QwwbqRSqvSpCM2' ? 'ADMIN' : 'VISOR';
  console.log(`Setting default role ${role} for user ${user.uid}`);
  await setDoc(docRef, { role, email: user.email || '', createdAt: Date.now() });
  return role;
}

export async function fetchAllUsersRoles(db) {
  const snapshot = await getDocs(collection(db, 'user_metadata'));
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
}

export async function saveUserRole(db, uid, role) {
  const docRef = doc(db, 'user_metadata', uid);
  await setDoc(docRef, { role, updatedAt: Date.now() }, { merge: true });
}

/**
 * TRANSACTIONS API (Debt and Payments)
 */
export async function fetchTransactions(db, clientId) {
  const collRef = collection(db, 'transactions');
  const q = query(collRef, where("clientId", "==", clientId));
  const snapshot = await getDocs(q);
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

/**
 * CHECK OPERATIONS API
 */
export async function fetchCheckOperations(db, uid) {
  const collRef = collection(db, 'check_operations');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveCheckOperation(db, uid, operation) {
  if (!uid) throw new Error("UID is required to save checks");
  const collRef = collection(db, 'check_operations');
  let docRef;
  
  // Destructure id out so it is NOT part of the data sent to Firestore
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

/**
 * ACCOUNTING API
 */
export async function fetchAccountingEntries(db, uid, collectionName = 'accounting_entries') {
  // Removemos el filtro por ownerUid para que sea una caja única compartida por todos
  const collRef = collection(db, collectionName);
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

/**
 * PRICE ANALYSIS API
 */
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
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
