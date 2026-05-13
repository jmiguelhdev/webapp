# Guía de Migración a Compose Multiplatform

Se ha inicializado la estructura base para migrar la aplicación a **Compose Multiplatform (Kotlin/Wasm)** en una nueva rama llamada `feature/compose-migration`.

## Estructura Creada
- `build.gradle.kts` y `settings.gradle.kts`: Configuración raíz de Gradle.
- `gradle/libs.versions.toml`: Gestión centralizada de versiones (Kotlin 2.1.0, Compose 1.7.1).
- `composeApp/`: Módulo dedicado para la nueva aplicación.
    - `src/commonMain/kotlin`: Código de UI y lógica compartida (incluye `App.kt`).
    - `src/wasmJsMain/kotlin`: Punto de entrada específico para Web/Wasm (`main.kt`).
    - `src/wasmJsMain/resources`: Recursos web (incluye `index.html`).

## Cómo Ejecutar (Desarrollo)
Para ver la aplicación en funcionamiento, necesitas tener instalado un JDK (versión 17 o superior) y ejecutar el siguiente comando desde la raíz:

```bash
# Si tienes gradle instalado:
gradle :composeApp:wasmJsBrowserDevelopmentRun --continuous

# Si prefieres instalar el wrapper de gradle primero (recomendado):
# (Requiere tener gradle instalado localmente una vez)
gradle wrapper
./gradlew :composeApp:wasmJsBrowserDevelopmentRun --continuous
```

## Próximos Pasos Recomendados
1. **Configurar el Tema**: Ajustar `App.kt` para que los colores coincidan exactamente con la estética actual de la app.
2. **Navegación**: Implementar `Jetpack Navigation` para manejar las diferentes pantallas (Viajes, Dashboard, etc.).
3. **Módulo de Datos**: Empezar a portar los servicios de Firebase a Kotlin usando el `Firebase Kotlin SDK`.
4. **Migración de Componentes**: Crear componentes reutilizables en Compose que repliquen los actuales en JS.
