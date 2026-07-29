# Análisis Técnico: Gestión de Viajes, Flujo de Datos y Propuestas de Mejora

Este documento presenta un análisis exhaustivo del módulo de **Gestión de Viajes** de la aplicación, detallando los datos consumidos, la arquitectura actual, los cuellos de botella identificados y las oportunidades de optimización y refactorización.

---

## 1. Arquitectura y Componentes del Módulo

El flujo de gestión de viajes se implementa bajo los principios de **Clean Architecture**, distribuyéndose en las siguientes capas:

* **UI (Capa de Presentación - Frameworks)**: 
  * [TravelsUI.js](file:///Users/jmiguelh/AndroidStudioProjects/appweb/webApp/src/frameworks/ui/screens/TravelsUI.js): Renderiza el listado, barra de búsqueda, chips de filtrado por categoría, filtros temporales, y la carga/escaneo de PDFs de faena.
* **Presenter (Capa de Adaptadores)**:
  * [TravelPresenter.js](file:///Users/jmiguelh/AndroidStudioProjects/appweb/webApp/src/adapters/presenters/TravelPresenter.js): Coordina el estado de la vista, aplica filtros temporales/búsquedas de forma reactiva y delega operaciones al repositorio.
* **Casos de Uso (Capa de Dominio)**:
  * [GetTravels.js](file:///Users/jmiguelh/AndroidStudioProjects/appweb/webApp/src/domain/usecases/GetTravels.js): Diseñado para obtener, filtrar y ordenar los viajes comerciales.
  * [CalculateCategoryStats.js](file:///Users/jmiguelh/AndroidStudioProjects/appweb/webApp/src/domain/usecases/CalculateCategoryStats.js): Procesa los totales de kilos, cabezas, comisiones y rendimientos.
  * [GetStockSummary.js](file:///Users/jmiguelh/AndroidStudioProjects/appweb/webApp/src/domain/usecases/GetStockSummary.js): Consolida el estado de stock en las cámaras frigoríficas.
* **Repositorios y API (Capa de Datos)**:
  * [TravelRepository.js](file:///Users/jmiguelh/AndroidStudioProjects/appweb/webApp/src/adapters/repositories/TravelRepository.js): Abstracción intermedia de datos de viajes y faenas.
  * [TravelApi.js](file:///Users/jmiguelh/AndroidStudioProjects/appweb/webApp/src/adapters/api/TravelApi.js): Implementa consultas directas y listeners en tiempo real a Firebase Firestore y guardado en IndexedDB (`localDb.travels`).

---

## 2. Flujo e Consumo de Datos

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
Al leer, la función `parseFirestoreDoc` en [common.js](file:///Users/jmiguelh/AndroidStudioProjects/appweb/webApp/src/adapters/api/common.js) deserializa el contenido para fusionarlo con propiedades del nivel superior del documento.

---

## 3. Problemas Detectados y Cuellos de Botella

A través del análisis del código, se han identificado las siguientes áreas críticas que afectan el rendimiento, la mantenibilidad y el cumplimiento de Clean Architecture:

### A. Omisión del Caso de Uso (`GetTravels`) en el Presenter
Aunque el presentador instancia el caso de uso `this.getTravelsUseCase = new GetTravels(travelRepository)` en su constructor, **nunca lo utiliza**. 
En su lugar, el presentador se suscribe directamente a la actualización en tiempo real mediante `this.travelRepository.subscribeTravels(...)` y mapea los datos crudos a entidades directamente dentro de su flujo interno. Esto rompe la regla de dependencia de Clean Architecture y duplica la lógica de filtrado de estados y ordenación que ya existe en el caso de uso.

### B. Consumo Excesivo de Ancho de Banda y CPU por Serialización JSON
Dado que todo el objeto de viaje (incluyendo productores asociados, listas de productos y liquidaciones fiscales) se almacena dentro de un campo string `data` en Firestore:
* **No es posible realizar consultas indexadas en Firestore**: Filtros simples como "filtrar por estado `ACTIVE`" o "buscar viajes de determinado CUIT" no pueden ejecutarse en el servidor de base de datos.
* **Carga masiva en el cliente**: El cliente web se ve forzado a descargar **todos** los viajes creados por el usuario, procesar las strings JSON en memoria y aplicar búsquedas o paginación en el navegador. A medida que el volumen histórico crezca, esto causará bloqueos de la UI y un consumo de red insostenible.
* **Riesgo de colisión de escrituras**: Si múltiples usuarios actualizan el mismo viaje de forma concurrente, se sobreescribirán mutuamente debido a que la actualización modifica el JSON completo de forma atómica en lugar de actualizar campos individuales.

### C. Asimetría de Caché Local y Tiempo Real
* El sistema cuenta con `SyncService.js` para sincronizar los viajes de forma eficiente a IndexedDB (`localDb.travels`).
* Sin embargo, `TravelPresenter` utiliza `subscribeToTravels` de Firestore en lugar del almacén local. Esto anula las ventajas del modo offline para viajes y provoca múltiples llamadas de red de lectura a Firebase en tiempo real, incrementando drásticamente el costo de cuota de Firestore.

### D. Fragilidad en el Emparejamiento de PDF de Faena
El algoritmo de emparejamiento entre un PDF importado de faena y un viaje existente se basa en la coincidencia del CUIT del productor y una proximidad de fechas de +/- 7 días:
* Si un productor envía múltiples tropas en una misma semana, el sistema puede emparejar los datos con el viaje logístico equivocado.

---

## 4. Plan de Acción y Propuestas de Mejora

Para solucionar estos inconvenientes y preparar el sistema para alta escala, se proponen las siguientes mejoras estratégicas:

### 1. Re-alinear la Capa de Presentación con los Casos de Uso
Refactorizar `TravelPresenter.js` para consumir el caso de uso `GetTravels`. La suscripción en tiempo real debería gatillar una actualización del almacén local o alertar al presentador de que debe invocar el caso de uso nuevamente para actualizar el estado visual de la UI.

### 2. Nuevo Esquema de JSON Documentado (para futura alineación en Android)
Para corregir el cuello de botella de la serialización en el futuro sin romper la compatibilidad inmediatamente, se propone migrar al siguiente esquema JSON nativo en Firestore, abstrayéndose de la string serializada en `data`:

```json
{
  "id": "15", // ID único del viaje
  "date": "2026-07-29", // Formato ISO YYYY-MM-DD
  "description": "Viaje a Planta 1",
  "status": "ACTIVE", // DRAFT, ACTIVE, COMPLETED
  "kmOnOrigin": 105200,
  "kmOnDestination": 105650,
  "pricePerKm": 1500,
  "litersOnPump": 120,
  "fuelPrice": 950,
  "tropa": "4028", // Tropa del viaje
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
  "createdAt": 1774807300000
}
```

### 3. Implementación de una Arquitectura "Local-First" para Viajes
Aprovechando Dexie.js (IndexedDB), el presentador debería suscribirse al almacén local de viajes. Cualquier escritura se realiza en `localDb` de forma inmediata (interfaz instantánea de 0ms de latencia) y un servicio de sincronización en segundo plano se encarga de subir las modificaciones pendientes a Firestore. Esto garantiza una operatividad offline del 100% y reduce a cero las lecturas redundantes en la nube.

### 4. Mejora del Algoritmo de Matching
Introducir un campo opcional para el "Número de Tropa" o "Número de Remito de Compra" al crear el viaje. Al procesar el PDF, la coincidencia por este identificador único de tropa debe priorizarse por encima del rango de fechas, eliminando la ambigüedad en periodos de alto tráfico de hacienda.
