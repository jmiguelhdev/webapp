# Capa de Frameworks y Detalles Técnicos (Frameworks)

La capa `src/frameworks/` agrupa todos los detalles de implementación específicos de las herramientas de terceros. Esto permite que el resto de la aplicación ignore cómo se dibujan los píxeles, cómo se almacena físicamente la base local o cómo se configura Firebase.

## Estructura

- **`ui/`**: 
  - Subdirectorios principales: `screens/`, `components/`, `reports/`.
  - Esta carpeta contiene toda la lógica relacionada con el DOM y los componentes visuales de la interfaz de Vanilla JS (creados mediante `document.createElement` o librerías de UI).
  - Escuchan al presentador y generan el HTML correspondiente. Las interacciones del usuario en el HTML (eventos `click`, `submit`) disparan funciones de retorno (`callbacks`) pasadas desde los Presenters.
  - Generación de reportes PDF, impresiones de Excel y recibos.

- **`db/`**:
  - Contiene la inicialización y el esquema de la base de datos local usando **Dexie.js**.
  - `localDb.js` define las tablas de IndexedDB (`travels`, `clientes`, `sync_logs`, etc.) garantizando una experiencia con soporte offline.

- **`firebase/`**:
  - `firebase.js`: Fichero de inicialización del SDK de Firebase, exponiendo las instancias de autenticación (`auth`), base de datos (`db` - Firestore), y funciones de la nube (`functions`).

- **`services/`**:
  - Servicios de infraestructura, como el **SyncService** (`SyncService.js`).
  - El servicio de sincronización se encarga de subir los cambios generados localmente a Firebase cuando se detecta conexión y sincronizar la base local IndexedDB con la nube, operando como un worker de segundo plano virtual.

- **`utils/`**:
  - Funciones auxiliares genéricas para formateo de moneda, manejo de fechas, operaciones del DOM (`dom.js`, `formatters.js`).

## Reglas de la Capa

1. **Aislamiento de la UI**: La manipulación directa del DOM (por ejemplo, `document.getElementById`) o el uso de librerías visuales como Chart.js solo puede ocurrir en `frameworks/ui/`.
2. **Desacoplamiento de Servicios**: La lógica de cómo sincronizar o cómo funciona Dexie.js se confina aquí. La capa de Adaptadores solo consume estos módulos como si fueran cajas negras.
