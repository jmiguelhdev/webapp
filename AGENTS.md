# Instrucciones para Agentes y Desarrolladores (Web/Wasm)

Este archivo contiene información sobre cómo el agente debe interactuar con este repositorio y dónde encontrar las guías de estilo y arquitectura para la versión web de Antigravity.

## Reglas del Proyecto (Web)

Para asegurar la calidad y consistencia del código en la migración a Compose Multiplatform para Web, existen reglas específicas adaptadas del entorno Android original.

### Localización de las Reglas

Cada categoría de reglas tiene su propio subdirectorio dentro de `.rules/` y contiene un archivo llamado `SKILL.md`.

**Ruta base:** `./.rules/`

### Categorías Disponibles

- **Compose UI (Web)**: Componentes responsivos, rendimiento en Wasm y recursos CMP.
    - Archivo: `./.rules/web-compose-ui/SKILL.md`
- **Capa de Datos (Firebase)**: Integración con Firebase Kotlin SDK, DTOs y mappers.
    - Archivo: `./.rules/web-data-layer/SKILL.md`
- **Navegación**: Rutas type-safe y compatibilidad con el navegador.
    - Archivo: `./.rules/web-navigation/SKILL.md`
- **Inyección de Dependencias**: Configuración de Koin para Wasm/JS.
    - Archivo: `./.rules/web-di-koin/SKILL.md`
- **Presentación (MVI)**: ViewModels compartidos y manejo de estado de UI.
    - Archivo: `./.rules/web-presentation-mvi/SKILL.md`
- **Manejo de Errores**: Estándares para excepciones y Result wrapper.
    - Archivo: `./.rules/web-error-handling/SKILL.md`

### Instrucción para el Agente

1. **Tiempo**: Usa siempre `kotlinx-datetime`.
2. **Nativo Web**: Prioriza el uso de APIs de Compose Multiplatform que sean compatibles con Wasm.
3. **Lectura Obligatoria**: Antes de realizar cualquier cambio, lee el archivo `SKILL.md` correspondiente a la tarea para seguir los patrones establecidos.

---
*Este repositorio es una migración de Android a Web utilizando Compose Multiplatform (Kotlin/Wasm).*
