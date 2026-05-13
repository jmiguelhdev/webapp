---
name: web-error-handling
description: |
  Estándares de manejo de errores para Web/KMP usando Result wrapper y DataError.
---

# Web / KMP Error Handling

## Result Wrapper

Usa un wrapper `Result<D, E>` para todas las operaciones que puedan fallar:
```kotlin
sealed interface Result<out D, out E: Error> {
    data class Success<out D>(val data: D): Result<D, Nothing>
    data class Error<out E: com.antigravity.webapp.domain.Error>(val error: E): Result<Nothing, E>
}
```

## DataError

Define errores de datos como una interfaz sellada:
```kotlin
sealed interface DataError: Error {
    enum class Network: DataError {
        SERVICE_UNAVAILABLE,
        PAYLOAD_TOO_LARGE,
        UNKNOWN
    }
    enum class Local: DataError {
        DISK_FULL,
        UNKNOWN
    }
}
```

## Mappers de Error

Crea funciones de extensión para convertir excepciones de Firebase en `DataError`.
