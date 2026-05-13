package com.antigravity.webapp.data.repository

import com.antigravity.webapp.domain.models.User
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

class MockAuthRepository : AuthRepository {
    
    private val _authState = MutableStateFlow<User?>(null)

    override fun getAuthState(): Flow<User?> = _authState

    override suspend fun signInWithGoogle(): Result<User> {
        delay(1000) // Simular red
        val fakeUser = User(
            uid = "12345",
            email = "admin@antigravity.com",
            displayName = "Admin Piola",
            photoUrl = ""
        )
        _authState.value = fakeUser
        return Result.success(fakeUser)
    }

    override suspend fun signOut(): Result<Unit> {
        delay(500)
        _authState.value = null
        return Result.success(Unit)
    }
}
