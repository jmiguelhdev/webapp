package com.antigravity.webapp.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.antigravity.webapp.data.repository.AuthRepository
import com.antigravity.webapp.domain.models.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MainState(
    val user: User? = null,
    val isLoading: Boolean = true
)

class MainViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _state = MutableStateFlow(MainState())
    val state = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.getAuthState().collect { user ->
                _state.update { it.copy(user = user, isLoading = false) }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.signOut()
        }
    }
}
