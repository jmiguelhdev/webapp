package com.antigravity.webapp.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class HomeViewModel : ViewModel() {

    private val _state = MutableStateFlow(HomeState())
    val state = _state.asStateFlow()

    fun onAction(action: HomeAction) {
        when (action) {
            HomeAction.OnRefreshClick -> refreshData()
        }
    }

    private fun refreshData() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            
            // Simulamos una carga de datos
            delay(1500)
            
            _state.update { 
                it.copy(
                    isLoading = false,
                    title = "Datos actualizados exitosamente"
                ) 
            }
        }
    }
}
