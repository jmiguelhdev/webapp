# Capa de Adaptadores (Adapters)

La capa de adaptadores (`src/adapters/`) sirve como intermediaria entre la capa de dominio interno y el mundo exterior (la vista y las bases de datos externas).

## Estructura

- **`presenters/`**:
  Contienen la lógica de presentación de la aplicación, siguiendo un enfoque MVP (Model-View-Presenter). 
  - Toman los datos en crudo que provienen de los casos de uso o repositorios y los formatean para la UI.
  - Reciben eventos o interacciones desde la vista (UI), procesan la intención, invocan la lógica correspondiente y actualizan el estado visual.
  - Ejemplos: `AccountingPresenter.js`, `TravelPresenter.js`, `ClientPresenter.js`.

- **`repositories/`**:
  Implementan la orquestación del acceso a los datos.
  - Reciben solicitudes de lectura/escritura de los Presenters o Casos de Uso.
  - Deciden de dónde extraer los datos (si de una caché local, IndexedDB, o directamente desde Firebase) apoyándose en la carpeta `api/`.
  - Ejemplos: `AccountingRepository.js`, `ClientRepository.js`.

- **`api/`**:
  Contienen el código específico que se acopla a las librerías de persistencia externas.
  - **Firebase Firestore:** Funciones que realizan consultas (`getDocs`, `query`), actualizaciones y eliminaciones directamente contra la base de datos de Google.
  - **Caché e IndexedDB:** Funciones para obtener/guardar información local con `Dexie.js` para asegurar la velocidad y la capacidad offline.
  - Ejemplos: `AccountingApi.js`, `EstablishmentApi.js`, `TravelApi.js`.

## Reglas de la Capa

1. **Responsabilidad**: Un repositorio no debe saber cómo se va a pintar un dato en el HTML. Su única responsabilidad es entregar el dato y guardar el dato correctamente.
2. **Desacoplamiento UI**: Los Presenters dictan qué debe mostrarse y en qué estado, pero *no interactúan directamente con el DOM*. La creación de elementos HTML es responsabilidad de la capa de frameworks (`src/frameworks/ui/`).
3. **Flujo Controlado**: La UI invoca métodos del Presenter -> El Presenter invoca el Repository -> El Repository llama a la API.
