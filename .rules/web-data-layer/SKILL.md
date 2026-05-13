---
name: web-data-layer
description: |
  Patrones de capa de datos para Web/Wasm - Firebase, repositorios, DTOs y mappers. Úsalo al crear fuentes de datos de Firebase, repositorios o mappers.
---

# Web / KMP Data Layer (Firebase focus)

## Data Source vs Repository

- **Data Source**: Accede directamente a Firebase (Firestore, Auth, Storage).
- **Repository**: Coordina múltiples fuentes o aplica lógica de cache/offline.

## Firebase Kotlin SDK (GitLive)

Usa la biblioteca compatible con KMP para acceder a Firebase de forma nativa en Wasm/JS:
```kotlin
// In commonMain
val firestore = Firebase.firestore
```

## DTOs y Modelos de Dominio

- Mantén siempre separados los DTOs de Firebase (con anotaciones `@Serializable` si es necesario) de los modelos de dominio.
- Los modelos de dominio no deben tener dependencias de Firebase.
- Usa mappers (funciones de extensión) en la capa de datos.

## Manejo de Errores

Usa el wrapper `Result<T, E>` definido en `web-error-handling`.
- Convierte las excepciones de Firebase a tipos de error de dominio (`DataError`).

## Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Firebase Data Source | `Firebase<Entity>DataSource` | `FirebaseTravelDataSource` |
| Repository Interface | `<Entity>Repository` | `TravelRepository` |
| DTO | `<Model>Dto` | `TravelDto` |
| Mapper | `fun <Model>Dto.to<Model>()` | `fun TravelDto.toTravel()` |
