package com.antigravity.webapp.ui.travels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.antigravity.webapp.data.repository.TravelRepository
import com.antigravity.webapp.domain.models.TravelStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update

class TravelsViewModel(
    private val travelRepository: TravelRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    private val _currentFilter = MutableStateFlow(TravelFilter.ALL)

    // El estado principal se deriva de combinar el repositorio (fuente de verdad),
    // la búsqueda y los filtros de la UI.
    val state: StateFlow<TravelsState> = combine(
        travelRepository.getTravels().onStart { /* Podríamos emitir carga local si es necesario */ },
        _searchQuery,
        _currentFilter
    ) { result, query, filter ->
        result.fold(
            onSuccess = { travels ->
                val filtered = travels.filter { travel ->
                    // 1. Aplicar filtro por estado
                    val matchesFilter = when (filter) {
                        TravelFilter.ALL -> true
                        TravelFilter.ACTIVE -> travel.status == TravelStatus.ACTIVE
                        TravelFilter.DRAFT -> travel.status == TravelStatus.DRAFT
                        TravelFilter.COMPLETED -> travel.status == TravelStatus.COMPLETED
                    }
                    
                    // 2. Aplicar búsqueda por texto (Ej: id, descripción, camión)
                    val matchesSearch = query.isBlank() ||
                            travel.description.contains(query, ignoreCase = true) ||
                            travel.truckName.contains(query, ignoreCase = true) ||
                            travel.id.contains(query, ignoreCase = true)

                    matchesFilter && matchesSearch
                }
                
                TravelsState(
                    isLoading = false,
                    travels = filtered,
                    searchQuery = query,
                    currentFilter = filter
                )
            },
            onFailure = { error ->
                TravelsState(
                    isLoading = false,
                    error = error.message ?: "Error desconocido al cargar viajes",
                    searchQuery = query,
                    currentFilter = filter
                )
            }
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = TravelsState(isLoading = true)
    )

    fun onAction(action: TravelsAction) {
        when (action) {
            is TravelsAction.OnSearchQueryChanged -> {
                _searchQuery.value = action.query
            }
            is TravelsAction.OnFilterChanged -> {
                _currentFilter.value = action.filter
            }
            is TravelsAction.OnTravelClick -> {
                // Aquí delegaríamos la navegación a la vista o lanzaríamos un evento único (SideEffect)
            }
            TravelsAction.OnAddNewTravel -> {
                // Navegar a creación
            }
        }
    }
}