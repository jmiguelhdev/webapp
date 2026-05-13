---
name: web-navigation
description: |
  Navegación segura y compatible con la web para Compose Multiplatform. Úsalo al configurar rutas o navegación entre pantallas.
---

# Web / KMP Navigation

## Principios

- **Navegación Type-safe**: Usa objetos `@Serializable` para las rutas.
- **Navegación por callbacks**: La comunicación entre pantallas de diferentes módulos debe ser mediante lambdas.
- **URL Support**: En la web, intenta que la navegación se refleje en la URL si usas una biblioteca compatible.

## Rutas

Define las rutas como objetos o data classes:
```kotlin
@Serializable object DashboardRoute
@Serializable data class TravelDetailRoute(val travelId: String)
```

## Estructura

- Define el grafo de navegación en el módulo de presentación.
- Usa `NavHost` de la biblioteca de navegación de Compose Multiplatform.
