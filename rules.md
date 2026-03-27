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

---
*Edita este archivo para agregar o modificar las reglas que el asistente debe seguir.*
