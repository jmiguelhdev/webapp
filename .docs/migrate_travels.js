(async () => {
  // Load firebase/firestore from CDN. We use the matching version or a compatible one.
  const { collection, getDocs, doc, writeBatch } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
  
  if (!window.db) {
    console.error("Firestore database instance (window.db) not found. Are you sure you are on the app page?");
    return;
  }
  
  console.log("Starting migration of travels (preserving 'data' for Android)...");
  const travelsColl = collection(window.db, 'travels');
  const snapshot = await getDocs(travelsColl);
  
  let migratedCount = 0;
  let batch = writeBatch(window.db);
  let operationCount = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.data && typeof data.data === 'string') {
      try {
        const parsed = JSON.parse(data.data);
        const docRef = doc(window.db, 'travels', docSnap.id);
        
        // Prepare native representation (but KEEP 'data' string for backward compatibility)
        const migratedData = {
          ...parsed,
          data: data.data, // Keep the original stringified data field
          updatedAt: Date.now()
        };
        
        // We use setDoc/set with merge to overwrite and create the native fields
        batch.set(docRef, migratedData, { merge: true });
        
        migratedCount++;
        operationCount++;
        
        // Firestore batches support up to 500 operations
        if (operationCount >= 400) {
          await batch.commit();
          console.log(`Committed batch of ${operationCount} migrations...`);
          batch = writeBatch(window.db);
          operationCount = 0;
        }
      } catch (e) {
        console.error(`Failed to parse/migrate document ${docSnap.id}:`, e);
      }
    } else {
      console.log(`Document ${docSnap.id} does not have a legacy 'data' string or is empty.`);
    }
  }
  
  if (operationCount > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${operationCount} migrations.`);
  }
  
  console.log(`Migration finished. Total migrated documents: ${migratedCount}`);
})();
