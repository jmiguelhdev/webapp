package com.antigravity.webapp.ui.travels

import com.antigravity.webapp.domain.models.Travel

/**
 * Define el estado y las acciones para la pantalla de Viajes (MVI).
 */

data class TravelsState(
    val isLoading: Boolean = false,
    val travels: List<Travel> = emptyList(),
    val error: String? = null,
    val searchQuery: String = "",
    val currentFilter: TravelFilter = TravelFilter.ALL
)

enum class TravelFilter {
    ALL, ACTIVE, DRAFT, COMPLETED
}

sealed interface TravelsAction {
    data class OnSearchQueryChanged(val query: String) : TravelsAction
    data class OnFilterChanged(val filter: TravelFilter) : TravelsAction
    data class OnTravelClick(val travelId: String) : TravelsAction
    data object OnAddNewTravel : TravelsAction
}
