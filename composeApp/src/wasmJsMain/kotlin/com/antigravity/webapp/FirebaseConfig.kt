package com.antigravity.webapp

import com.antigravity.webapp.data.firebase.*

internal val firebaseConfigJsObj: JsAny = js("""
    ({
        apiKey: window.env_API_KEY || '',
        appId: window.env_APP_ID || '',
        projectId: window.env_PROJECT_ID || '',
        authDomain: window.env_AUTH_DOMAIN || '',
        storageBucket: window.env_STORAGE_BUCKET || '',
        messagingSenderId: window.env_MESSAGING_SENDER_ID || '',
        measurementId: window.env_MEASUREMENT_ID || ''
    })
""")

object FirebaseConfig {
    var app: FirebaseApp? = null
        private set
        
    var firestore: Firestore? = null
        private set
        
    var auth: Auth? = null
        private set

    fun initialize() {
        try {
            app = FirebaseAppModule.initializeApp(firebaseConfigJsObj)
            firestore = FirestoreModule.getFirestore(app!!)
            auth = FirebaseAuthModule.getAuth(app!!)
            
            println("Firebase nativo (JS Interop) inicializado en Wasm.")
            
        } catch (e: Exception) {
            println("Error al inicializar Firebase JS Interop: ${e.message}")
        }
    }
}
