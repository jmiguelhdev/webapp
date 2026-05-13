package com.antigravity.webapp.ui.home

// Estado de la vista (State)
data class HomeState(
    val isLoading: Boolean = false,
    val title: String = "Bienvenido a Antigravity Web"
)

// Acciones del usuario (Intent)
sealed interface HomeAction {
    data object OnRefreshClick : HomeAction
}
