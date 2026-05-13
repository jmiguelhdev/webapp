---
name: web-presentation-mvi
description: |
  Patrones de presentación MVI (Model-View-Intent) para ViewModels compartidos en Web/Wasm.
---

# Web / KMP Presentation (MVI)

## Principios

- **Estado Único**: Cada pantalla tiene un único `StateFlow` que emite el estado de la UI.
- **Acciones (Intents)**: La UI envía acciones al ViewModel; el ViewModel nunca expone funciones públicas que realicen lógica compleja directamente.
- **ViewModel Compartido**: El ViewModel debe vivir en `commonMain` para que pueda ser reutilizado.

## Estructura del ViewModel

```kotlin
class TravelViewModel(
    private val repository: TravelRepository
) : ViewModel() {

    private val _state = MutableStateFlow(TravelState())
    val state = _state.asStateFlow()

    fun onAction(action: TravelAction) {
        when (action) {
            is TravelAction.OnRefresh -> refreshData()
            is TravelAction.OnTravelClick -> navigateToDetail(action.id)
        }
    }
}
```

## Consumo en la UI

```kotlin
@Composable
fun TravelScreen(viewModel: TravelViewModel) {
    val state by viewModel.state.collectAsState()
    
    TravelContent(
        state = state,
        onAction = viewModel::onAction
    )
}
```
