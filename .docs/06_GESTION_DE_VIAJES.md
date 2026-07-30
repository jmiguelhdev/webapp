# Gestión de Viajes (Deep Dive)

Este documento presenta un análisis profundo del módulo de **Gestión de Viajes** de la aplicación `kmp-travel-web`, detallando los datos consumidos, la arquitectura actual, los cuellos de botella identificados y las oportunidades de optimización y refactorización.

## 1. Arquitectura y Componentes del Módulo

El flujo de gestión de viajes se implementa bajo los principios de **Clean Architecture**, distribuyéndose en las siguientes capas:

* **UI (Capa de Presentación - Frameworks)**: 
  * `TravelsUI.js`: Renderiza el listado, barra de búsqueda, chips de filtrado por categoría, filtros temporales, y la carga/escaneo de PDFs de faena.
* **Presenter (Capa de Adaptadores)**:
  * `TravelPresenter.js`: Coordina el estado de la vista, aplica filtros temporales/búsquedas de forma reactiva y delega operaciones al repositorio.
* **Casos de Uso (Capa de Dominio)**:
  * `GetTravels.js`: Diseñado para obtener, filtrar y ordenar los viajes comerciales.
  * `CalculateCategoryStats.js`: Procesa los totales de kilos, cabezas, comisiones y rendimientos.
  * `GetStockSummary.js`: Consolida el estado de stock en las cámaras frigoríficas.
* **Repositorios y API (Capa de Datos)**:
  * `TravelRepository.js`: Abstracción intermedia de datos de viajes y faenas.
  * `TravelApi.js`: Implementa consultas directas y listeners en tiempo real a Firebase Firestore y guardado en IndexedDB (`localDb.travels`).

## 2. Flujo y Consumo de Datos

### Colecciones y Almacenamiento Utilizados
1. **`travels` (Firestore / IndexedDB)**: Almacena los viajes logísticos. 
2. **`faenas_detalle` (Firestore / IndexedDB)**: Guarda el desglose de garrones de reses importados de los PDFs.
3. **`master_data` (Firestore)**: Datos maestros de camiones (`TRUCK`), choferes (`DRIVER`), agentes (`AGENT`), y productos.
4. **`proveedores` (Firestore)**: Entidades de productores asociados.
5. **`price_lists` y `clientes` (Firestore)**: Precios de referencia e información de clientes para el arqueo y despacho de mercadería.

### Estrategia de Persistencia (Serialización JSON)
Para mantener flexibilidad en la estructura jerárquica de los viajes, el sistema utiliza un enfoque de serialización de campo único en Firestore. El documento de viaje expone una propiedad `data` que contiene el objeto completo serializado como string JSON:

```javascript
// Ejemplo de persistencia en TravelApi.js
const dataToSave = {
  data: JSON.stringify(travelObject),
  updatedAt: Date.now()
};
```
Al leer, la función `parseFirestoreDoc` en `common.js` deserializa el contenido para fusionarlo con propiedades del nivel superior del documento.

## 3. Problemas Corregidos y Optimizaciones Aplicadas

### A. Alineación de la Capa de Presentación con el Caso de Uso (`GetTravels`) [RESUELTO]
* **Antes**: El presentador (`TravelPresenter`) instanciaba el caso de uso `GetTravels` pero realizaba lecturas crudas directas al repositorio en la carga inicial y en las actualizaciones, duplicando la lógica de filtrado y ordenamiento.
* **Solución**: Se refactorizó `TravelPresenter.js` para realizar todas las operaciones de carga y actualización de datos a través de `this.getTravelsUseCase.execute(...)`, cumpliendo rigurosamente las reglas de Clean Architecture.

### B. Consumo Excesivo de Ancho de Banda y CPU por Serialización JSON [RESUELTO]
* **Antes**: Todo el objeto de viaje se guardaba en un campo string `data`, lo que impedía consultas nativas indexadas en Firestore, requería carga masiva en memoria del cliente y causaba riesgos de colisión de escrituras.
* **Solución**: Se ejecutó una migración a un esquema nativo JSON en Firestore (preservando el campo `data` string para mantener la total compatibilidad con la app móvil de Android y clientes antiguos). Las funciones `saveTravel` y `updateTravel` ahora operan en formato dual.

### C. Implementación de una Arquitectura "Local-First" Real [RESUELTO]
* **Antes**: `TravelPresenter` abría un listener de Firestore en tiempo real (`subscribeToTravels`) sobre toda la colección de viajes, anulando las ventajas offline y consumiendo excesiva cuota de lecturas de red.
* **Solución**: Se eliminó la suscripción en tiempo real de Firestore. El presentador lee exclusivamente de la base de datos local IndexedDB (`localDb.travels`). El servicio de sincronización `SyncService.js` descarga las modificaciones delta en segundo plano y notifica a `main.js` mediante el evento `app:sync-completed`, el cual refresca de forma silenciosa la vista activa de viajes.

### D. Robusto Algoritmo de Emparejamiento de PDF de Faena [RESUELTO]
* **Antes**: El algoritmo de matching de PDF utilizaba solo el CUIT del productor y proximidad de fechas, lo que producía colisiones en periodos de alto tráfico si el productor enviaba múltiples tropas.
* **Solución**: Se mejoró el algoritmo para priorizar estrictamente el identificador único `tropa`. Si ambos registros (el viaje y el PDF) exponen números de tropa pero estos difieren, la asociación es rechazada de inmediato, evitando asignaciones erróneas.

## 4. Estructura de Datos y Estado de Persistencia Actual

### Nuevo Esquema Nativo en Firestore
Tanto las escrituras como las lecturas conviven en un modelo híbrido estructurado:

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
  "data": "{\"id\":\"15\",\"status\":\"ACTIVE\",...}", // Copia stringificada para compatibilidad móvil
  "updatedAt": 1774893700000,
  "createdAt": 1774807300000
}
```
