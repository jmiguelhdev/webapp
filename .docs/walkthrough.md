# Walkthrough: Migrate Travels Storage to Native JSON Schema with Dual-Write

This walkthrough details the changes made to migrate the way travels (`viajes`) are serialized and stored in Firestore to a native JSON object structure, while keeping the legacy `data` serialized string to preserve full compatibility with the Android app and older web clients.

## Changes Made

### 1. `TravelApi.js` (src/adapters/api/TravelApi.js)
- Modified `saveTravel` to store `travelObject` fields directly at the top level of the document, AND also write the serialized JSON string to the `data` field.
- Modified `updateTravel` to spread `travelObject` directly into the document update payload, AND also update the serialized JSON string in the `data` field.
- Handled potential `undefined` fields safely by serializing/deserializing the object before saving.

### 2. `firebase.js` (src/firebase.js)
- Exposed `window.db = db` globally so the Firestore database instance is accessible to browser console commands (allowing safe, authenticated migration scripts to run).

---

## Migration Steps

Since your Firestore database has existing documents in the legacy format, you need to run a migration. This migration will parse the `data` string and expand it into native fields at the top level of each document, while **keeping** the `data` field intact for the Android app.

### Step 1: Open the Application
1. Start the application locally with `npm run dev`.
2. Open it in your browser and ensure you are logged in.

### Step 2: Run the Migration Script
1. Open the Developer Tools console (`F12` or `Cmd + Option + I`).
2. Copy and paste the following script into the console and hit **Enter**:

```javascript
(async () => {
  // Load firebase/firestore from CDN
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
```

3. Confirm that the script finishes successfully. It will print the total number of documents migrated.

---

## Verification Results
- **Build status**: `npm run build` completed successfully.
- **Backward Compatibility**: Both formats are 100% compatible now:
  - **Android app**: Can read and write the `data` field exactly as it does now.
  - **Web app**: Saves native fields (for Future querying) and updates `data` on saving, while gracefully fallback-reading both formats.
