# 07. Migración de Esquema de Viajes a JSON Nativo (Firestore)

Este documento detalla la migración del esquema de almacenamiento para la colección `travels` en Firestore, pasando de una cadena JSON serializada en un campo único (`data`) a un formato JSON nativo con campos de primer nivel, asegurando la compatibilidad retroactiva con la aplicación Android.

---

## 1. Motivación del Cambio

El esquema anterior almacenaba todo el objeto del viaje como una cadena JSON en el campo `data`:
```json
{
  "data": "{\"id\":\"15\",\"date\":\"2026-07-29\",...}",
  "updatedAt": 1774893700000
}
```

### Problemas del esquema anterior:
* **Imposibilidad de realizar consultas en el servidor**: No se podían filtrar viajes por estado (ej. `status == "ACTIVE"`) o por chofer/camión directamente en Firestore, obligando a descargar todos los viajes en memoria del cliente.
* **Sobrecarga de Red y CPU**: Alto consumo de ancho de banda y procesamiento en el cliente al tener que parsear JSON de forma masiva en cada sincronización.

---

## 2. Estrategia de Compatibilidad (Dual-Write)

Para evitar romper el funcionamiento de la **aplicación Android**, la cual depende estrictamente del campo `data` serializado para su funcionamiento:
```kotlin
// En Android (FirestoreDataSource.kt)
json.decodeFromString<Travel>(dto.data)
```

Hemos implementado una **estrategia de Escritura Dual (Dual-Write)**. Los documentos de Firestore ahora contienen:
1. **Campos nativos de primer nivel** (para búsquedas indexadas y consumo optimizado desde la web).
2. **El campo `data` como String JSON** (para mantener compatibilidad absoluta con la app Android).

### Estructura en Firestore tras la migración:
```json
{
  "id": "15",
  "date": "2026-07-29",
  "description": "Viaje a Planta 1",
  "status": "ACTIVE",
  "kmOnOrigin": 105200,
  "kmOnDestination": 105650,
  "pricePerKm": 1500,
  "litersOnPump": 120,
  "fuelPrice": 950,
  "tropa": "4028",
  "truck": {
    "id": "truck_01",
    "name": "Scania R450",
    "licensePlate": "AA123BB",
    "driver": {
      "id": "driver_01",
      "name": "Juan Perez"
    }
  },
  "buy": {
    "agent": {
      "name": "Pedro Gomez",
      "percent": 2.5
    },
    "totalReduce": 45000,
    "listOfProducers": [
      {
        "producer": {
          "name": "Estancia La Linda",
          "cuit": "20-12345678-9",
          "cbu": "0170001234000056789012"
        },
        "origin": "Azul",
        "manualIva": null,
        "listOfProducts": [
          {
            "name": "NOVILLO",
            "kg": 12500,
            "roughing": 8,
            "price": 2100,
            "quantity": 30,
            "kgFaena": 11450
          }
        ]
      }
    ]
  },
  "updatedAt": 1774893700000,
  "createdAt": 1774807300000,
  "data": "{\"id\":\"15\",\"date\":\"2026-07-29\",...}"
}
```

---

## 3. Cambios en el Código

### A. Persistencia en Web (`TravelApi.js`)
Se modificaron las funciones `saveTravel` y `updateTravel` para esparcir las propiedades del viaje nativamente, manteniendo el campo `data` actualizado:

```javascript
// src/adapters/api/TravelApi.js
export async function updateTravel(db, uid, travelId, travelObject) {
  const docRef = doc(db, 'travels', String(travelId));
  const dataToSave = {
    ...JSON.parse(JSON.stringify(travelObject)),
    data: JSON.stringify(travelObject), // Para Android
    updatedAt: Date.now()
  };
  await updateDoc(docRef, dataToSave);
  // ...
}
```

### B. Exposición de Instancia Firestore (`firebase.js`)
Para facilitar las tareas de migración en la base de datos de producción, se expuso la instancia de base de datos de Firestore globalmente en el navegador:
```javascript
// src/firebase.js
export const db = getFirestore(app);
if (typeof window !== 'undefined') {
  window.db = db;
}
```

---

## 4. Proceso de Migración en Producción

Para migrar los viajes antiguos a la nueva estructura nativa sin eliminar la propiedad `data` (manteniendo la compatibilidad con Android):

1. Abre la aplicación web en tu entorno de desarrollo/producción e inicia sesión.
2. Abre la consola de desarrollador (`F12`).
3. Pega y ejecuta el siguiente script:

```javascript
(async () => {
  const { collection, getDocs, doc, writeBatch } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
  
  if (!window.db) {
    console.error("No se encontró window.db");
    return;
  }
  
  console.log("Iniciando migración...");
  const snapshot = await getDocs(collection(window.db, 'travels'));
  let batch = writeBatch(window.db);
  let count = 0;
  let opCount = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.data && typeof data.data === 'string') {
      try {
        const parsed = JSON.parse(data.data);
        const docRef = doc(window.db, 'travels', docSnap.id);
        
        // Esparcimos propiedades nativas y conservamos 'data'
        const migrated = {
          ...parsed,
          data: data.data,
          updatedAt: Date.now()
        };
        
        batch.set(docRef, migrated, { merge: true });
        count++;
        opCount++;
        
        if (opCount >= 400) {
          await batch.commit();
          batch = writeBatch(window.db);
          opCount = 0;
        }
      } catch (e) {
        console.error("Error en documento " + docSnap.id, e);
      }
    }
  }
  
  if (opCount > 0) {
    await batch.commit();
  }
  console.log("Migración completada. Viajes procesados: " + count);
})();
```
