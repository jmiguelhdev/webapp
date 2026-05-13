package com.antigravity.webapp.data.repository

import com.antigravity.webapp.domain.models.User
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    fun getAuthState(): Flow<User?>
    suspend fun signInWithGoogle(): Result<User>
    suspend fun signOut(): Result<Unit>
}
