# Capa de Dominio (Domain)

La capa de dominio (`src/domain/`) es el corazón de la aplicación. Aquí residen las reglas de negocio, y debe ser totalmente independiente de los frameworks (como Vue, React, Vanilla JS DOM) o las tecnologías de bases de datos externas (como Firebase o IndexedDB).

## Estructura

- **`entities/`**: 
  Contiene los modelos de datos básicos que representan objetos del mundo real y negocio de la aplicación. Las entidades definen las propiedades y el comportamiento fundamental (métodos) de los objetos de negocio. Ejemplos de entidades en esta app serían `Travel` (Viaje), `Client` (Cliente), `Entry` (Asiento contable).
  
- **`usecases/`**: 
  Contiene los "Casos de Uso" o interactores. Cada archivo en esta carpeta representa una acción específica que el usuario o el sistema puede realizar. 
  Orquestan el flujo de datos hacia y desde las entidades. En el patrón arquitectónico, los Casos de Uso consumen los repositorios (inyectados mediante interfaces o dependencias).
  Ejemplos propuestos o actuales: `GetTravels`, `CalculateSalary`, `SyncData`.

- **`utils/`**:
  Utilidades y funciones puras exclusivas de la lógica de negocio que no dependen de librerías externas o detalles de implementación.

## Reglas de la Capa

1. **Aislamiento**: Ningún archivo dentro de `src/domain/` debe importar código de `src/frameworks/`, `src/adapters/` o de `node_modules` relacionados con la interfaz visual.
2. **Lógica Pura**: La lógica aquí debe poder probarse fácilmente mediante pruebas unitarias sin necesidad de levantar un DOM o conectarse a Firestore.
3. **Inversión de Dependencias**: Los Casos de Uso dependen de abstracciones (interfaces de repositorios). La implementación concreta de esos repositorios se proporciona en la capa de `adapters`.
