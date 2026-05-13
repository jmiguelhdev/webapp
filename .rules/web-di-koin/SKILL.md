---
name: web-di-koin
description: |
  Inyección de dependencias con Koin en Compose Multiplatform Web/Wasm.
---

# Web / KMP Dependency Injection (Koin)

## Configuración

Define tus módulos en `commonMain`:
```kotlin
val appModule = module {
    single<TravelRepository> { OfflineFirstTravelRepository(get()) }
    viewModel { DashboardViewModel(get()) }
}
```

## Inicialización

Inicia Koin en el punto de entrada de la aplicación (`main.kt` para Wasm):
```kotlin
fun main() {
    startKoin {
        modules(appModule)
    }
    ComposeViewport(document.body!!) {
        App()
    }
}
```

## Uso en Composables

Usa `koinViewModel()` para obtener instancias de ViewModel dentro de tus pantallas.
