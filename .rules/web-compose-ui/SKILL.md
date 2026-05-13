---
name: web-compose-ui
description: |
  Patrones de UI de Compose para Web/Wasm - estabilidad, recomposición, efectos secundarios, listas optimizadas, animaciones y diseño responsivo. Úsalo siempre que escribas composables para la web, optimices el rendimiento en Wasm o crees componentes visuales.
---

# Web / KMP Compose UI Patterns

## Principio Core

La UI es tonta ("dumb"). Los composables renderizan el estado y envían acciones del usuario — nada más. Toda la lógica vive en el ViewModel o en la capa de dominio.

## Estabilidad y Recomposición

En Compose para Web/Wasm, el rendimiento es crítico debido al overhead de la recolección de basura en WebAssembly.

- Anota los estados de datos con `@Stable` cuando contengan colecciones (`List`, `Map`) o interfaces.
- Usa tipos primitivos y tipos estables siempre que sea posible.

## Gestión de Estado

- Todo el estado vive en el ViewModel.
- **Diferencia con Android**: Usa `collectAsState()` en lugar de `collectAsStateWithLifecycle()` a menos que uses una biblioteca de ciclo de vida compatible con KMP.
- No uses `remember` para estado de aplicación; solo para estado interno de la UI (ej. `ScrollState`).
- Para cada estado genera una preview
## Recursos (Imágenes y Strings)

Usa el sistema de recursos de Compose Multiplatform:
```kotlin
// Bien
Text(stringResource(Res.string.app_name))
Image(painterResource(Res.drawable.logo), contentDescription = null)
```

## Animaciones

Evita animaciones que provoquen recomposiciones constantes. Prefiere:
- `graphicsLayer` para transformaciones (alpha, scale, rotation).
- Lambdas de offset para evitar recomposición en cambios de posición.

## Diseño Responsivo

Dado que es una aplicación web, asegúrate de que los layouts se adapten a diferentes tamaños de ventana:
- Usa `BoxWithConstraints` para obtener el tamaño disponible.
- Define breakpoints para layouts móviles vs escritorio.
