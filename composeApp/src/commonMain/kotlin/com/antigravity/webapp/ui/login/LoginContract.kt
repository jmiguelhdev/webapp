package com.antigravity.webapp.ui.login

data class LoginState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isAuthenticated: Boolean = false
)

sealed interface LoginAction {
    data object OnGoogleLoginClick : LoginAction
}
