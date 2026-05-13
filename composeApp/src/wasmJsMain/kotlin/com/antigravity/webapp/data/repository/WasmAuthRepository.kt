package com.antigravity.webapp.data.repository

import com.antigravity.webapp.data.firebase.*
import com.antigravity.webapp.domain.models.User
import com.antigravity.webapp.FirebaseConfig
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.await
import kotlin.js.Promise

class WasmAuthRepository : AuthRepository {

    override fun getAuthState(): Flow<User?> = callbackFlow {
        val auth = FirebaseConfig.auth
        if (auth == null) {
            trySend(null)
            close()
            return@callbackFlow
        }

        val unsubscribeJsFn = FirebaseAuthModule.onAuthStateChanged(auth) { jsUser ->
            if (jsUser != null) {
                trySend(User(
                    uid = jsUser.uid,
                    email = jsUser.email ?: "",
                    displayName = jsUser.displayName ?: "",
                    photoUrl = jsUser.photoURL ?: ""
                ))
            } else {
                trySend(null)
            }
        }

        awaitClose {
            callUnsubscribe(unsubscribeJsFn)
        }
    }

    override suspend fun signInWithGoogle(): Result<User> {
        println("[DEBUG_AUTH] Iniciando signInWithGoogle...")
        val auth = FirebaseConfig.auth ?: run {
            println("[DEBUG_AUTH] Error: Auth no inicializado")
            return Result.failure(Exception("Auth not initialized"))
        }
        
        return try {
            println("[DEBUG_AUTH] Instanciando GoogleAuthProvider mediante helper...")
            val provider: AuthProvider = instantiateGoogleAuthProvider()
            
            println("[DEBUG_AUTH] Llamando a signInWithPopup mediante helper...")
            val credentialPromise: Promise<UserCredential> = callSignInWithPopup(auth, provider)
            val credential = credentialPromise.await<UserCredential>()
            
            println("[DEBUG_AUTH] Login exitoso, obteniendo usuario...")
            val jsUser = getJsUserFromCredential(credential)
            val user = User(
                uid = jsUser.uid,
                email = jsUser.email ?: "",
                displayName = jsUser.displayName ?: "",
                photoUrl = jsUser.photoURL ?: ""
            )
            println("[DEBUG_AUTH] Usuario obtenido: ${user.email}")
            Result.success(user)
        } catch (t: Throwable) {
            println("[DEBUG_AUTH] Error en signInWithGoogle: ${t.message}")
            Result.failure(Exception(t.message))
        }
    }

    override suspend fun signOut(): Result<Unit> {
        println("[DEBUG_AUTH] Cerrando sesión...")
        val auth = FirebaseConfig.auth ?: return Result.failure(Exception("Auth not initialized"))
        return try {
            val result: JsAny? = FirebaseAuthModule.signOut(auth).await()
            println("[DEBUG_AUTH] Sesión cerrada correctamente")
            Result.success(Unit)
        } catch (t: Throwable) {
            println("[DEBUG_AUTH] Error al cerrar sesión: ${t.message}")
            Result.failure(Exception(t.message))
        }
    }
}

// === Wasm specific helpers for Auth ===

private fun getJsUserFromCredential(credential: UserCredential): FirebaseUser =
    js("credential.user")

private fun instantiateGoogleAuthProvider(): AuthProvider =
    js("window.createGoogleAuthProvider()")

private fun callSignInWithPopup(auth: Auth, provider: AuthProvider): Promise<UserCredential> =
    js("window.firebaseSignInWithPopup(auth, provider)")
