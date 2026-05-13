package com.antigravity.webapp.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.antigravity.webapp.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class LoginViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _state = MutableStateFlow(LoginState())
    val state = _state.asStateFlow()

    init {
        // Escuchar el estado de autenticación (por si ya estamos logueados)
        viewModelScope.launch {
            authRepository.getAuthState().collect { user ->
                if (user != null) {
                    _state.update { it.copy(isAuthenticated = true, isLoading = false) }
                } else {
                    _state.update { it.copy(isAuthenticated = false) }
                }
            }
        }
    }

    fun onAction(action: LoginAction) {
        when (action) {
            LoginAction.OnGoogleLoginClick -> signIn()
        }
    }

    private fun signIn() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            val result = authRepository.signInWithGoogle()
            
            result.fold(
                onSuccess = {
                    // El listener en el init{} capturará el cambio y actualizará isAuthenticated a true
                },
                onFailure = { error ->
                    _state.update { 
                        it.copy(
                            isLoading = false, 
                            error = error.message ?: "Error desconocido al iniciar sesión"
                        ) 
                    }
                }
            )
        }
    }
}
