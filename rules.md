# Reglas del Proyecto KMP App Web

Este archivo contiene las reglas de negocio, estándares de arquitectura y principios de diseño para el mantenimiento y evolución de la aplicación.

## 🏗️ Arquitectura y Principios
- **Clean Architecture**: Mantener la separación clara entre capas (Domain, Usecases, Adapters/Presenters, Frameworks/UI).
- **SOLID**: Aplicar los principios SOLID en todo momento para garantizar un código mantenible y escalable.
- **Entidades de Dominio**: Toda la lógica de cálculo (promedios, kilos limpios, totales, simulaciones) DEBE residir en las entidades de dominio (`src/domain/entities`).
- **Casos de Uso**: La orquestación de datos para la UI (como el cálculo de estadísticas por categorías) DEBE realizarse a través de casos de uso (`src/domain/usecases`).

## 🐄 Reglas de Negocio: Categorías
- **Normalización**: El nombre del producto debe ser estandarizado usando `resolveCategoryFromName`.
- **Mapeos Estándar**:
    - `NOVILLO`: Incluye "nov", "nto", "mej", "novillito", etc.
    - `VAQUILLONA`: Incluye "vq", "vaq".
    - `VACA`: Incluye "vaca", "vac", "va".
    - `TORO`: Incluye "toro", "to".
- **Multi-select**: El selector de categorías debe permitir seleccionar múltiples filtros simultáneamente.

## 🧮 Simulador de Costos
- **Modelo de Cálculo**: Seguir estrictamente el modelo inyectable de Kotlin para el cálculo de:
    - `kgVivos` (dependiente del tipo de jaula).
    - `precioKm` (dependiente del tipo de jaula).
    - `utilidadPorKg` y `costoIIBB`.
- **Impuestos**: El porcentaje de IIBB debe ser configurable y reflejarse en el costo final.

## 🎨 Diseño y UI
- **Aesthetics**: Uso de modo oscuro, micro-animaciones, chips dinámicos y un look "premium".
- **Frameworks**: Vanilla JavaScript con Vite, sin dependencias pesadas de componentes externos siempre que sea posible.

## 🧪 Pruebas y Control de Calidad (Testing)
- **Prioridad de Cobertura**: Se exige un **100% de cobertura** en la lógica de negocio (Entidades de Dominio y Casos de Uso). Las pruebas de UI/Integración se aplican a flujos críticos.
- **Herramientas**: Uso mandatorio de **Vitest**. Al compartir configuración con Vite, garantiza ejecuciones ultra rápidas.
- **Nomenclatura y Estructura**: 
    - Archivos `.test.js` o `.spec.js` ubicados junto al archivo origen o en directorios `__tests__`.
    - Seguir estrictamente el **Patrón AAA** (Arrange, Act, Assert) para garantizar legibilidad.

## 🐛 Manejo de Errores y Logs
- **Logger Centralizado**: Prohibido el uso de `console.log()` en producción. Todo registro debe canalizarse a través de una utilidad central (ej. `src/utils/logger.js`).
- **Niveles por Entorno**: El Logger debe discriminar entre entornos usando `import.meta.env.DEV`. Logs informativos solo en desarrollo; advertencias y errores críticos en producción.
- **Excepciones de Dominio**: Implementar clases de error personalizadas (`ValidationError`, `NetworkError`, `DomainRuleError`) que extiendan de `Error`. Esto permite capturas precisas en Controllers y mensajes amigables en la UI.

## ✨ Estándares de Código y Consistencia
- **Linters y Formateo**: Uso obligatorio de ESLint y Prettier. El código debe estar libre de warnings antes de cada commit.
- **Nomenclatura Estricta**:
    - `camelCase`: Variables, funciones y métodos.
    - `PascalCase`: Clases, Entidades y Componentes UI.
    - `UPPER_SNAKE_CASE`: Constantes globales.
- **Inmutabilidad por Defecto**: Priorizar `const` sobre `let`. Queda prohibida la mutación directa de objetos/arrays; usar spread operator o métodos inmutables (`map`, `filter`, `reduce`).
- **Documentación**: Usar JSDoc para tipado y descripción de funciones, facilitando la mantenibilidad y el intellisense.

## 🎨 Manipulación del DOM (Vanilla JS)
- **Cero Lógica en UI**: Los archivos de vista/DOM solo deben renderizar datos y capturar eventos. No deben realizar cálculos; esa responsabilidad es de los Presenters o Casos de Uso.
- **Delegación de Eventos**: Para elementos dinámicos (listas, tablas), aplicar **Event Delegation** en el contenedor padre para mejorar el rendimiento.
- **Gestión de Memoria**: Es obligatorio eliminar `eventListeners` (`removeEventListener`) cuando un componente se remueve del DOM para evitar fugas de memoria (Memory Leaks).

## 📝 Documentación y Auto-explicación
- **JSDoc Mandatorio**: Todas las funciones, clases y métodos deben estar documentados con JSDoc. Es vital definir `@param`, `@returns` y, cuando sea necesario, `@throws`. Esto garantiza un Intellisense potente y actúa como contrato técnico.
- **Código Auto-documentado**: Priorizar nombres de variables y funciones tan descriptivos que el código sea legible por sí mismo. Si necesitas un comentario para explicar *qué* hace una línea, considera refactorizar el nombre.
- **El "Por qué", no el "Qué"**: Los comentarios deben explicar la intención, reglas de negocio complejas o decisiones de diseño no evidentes (el por qué). No repetir lo que el código ya dice.
- **README de Módulo**: En directorios complejos, incluir un `README.md` breve que explique la responsabilidad del módulo y cómo interactúa con el resto del sistema.
- **Mantenimiento**: La documentación obsoleta es peor que la falta de ella. Es obligatorio actualizar los comentarios y JSDoc al modificar la lógica subyacente.

## 🌿 Control de Versiones y Terminal
- **Conventional Commits**: Los mensajes de commit deben seguir el estándar (ej. `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
- **Estrategia de Ramas**: El desarrollo directo en `main` está prohibido. Utilizar ramas descriptivas: `feature/nombre-funcionalidad` o `bugfix/descripcion-error`.
- **Integridad**: Antes de pushear, asegurar que el proyecto compila y los tests pasan localmente.

---
*Edita este archivo para agregar o modificar las reglas que el asistente debe seguir.*
