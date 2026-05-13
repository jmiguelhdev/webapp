package com.antigravity.webapp.data.firebase

/**
 * Kotlin/Wasm Interop bindings para el SDK Oficial de Firebase Auth (Modular v9/v10).
 */

external interface Auth : JsAny
external interface AuthProvider : JsAny
external interface UserCredential : JsAny
external interface FirebaseUser : JsAny {
    val uid: String
    val email: String?
    val displayName: String?
    val photoURL: String?
}

@JsModule("firebase/auth")
external object FirebaseAuthModule {
    fun getAuth(app: FirebaseApp): Auth
    fun GoogleAuthProvider(): AuthProvider
    
    // Auth State
    fun onAuthStateChanged(
        auth: Auth,
        nextOrObserver: (FirebaseUser?) -> Unit
    ): JsAny // Retorna función de desuscripción
    
    // Login / Logout
    fun signInWithPopup(auth: Auth, provider: AuthProvider): kotlin.js.Promise<UserCredential>
    fun signOut(auth: Auth): kotlin.js.Promise<JsAny>
}
