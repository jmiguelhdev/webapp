package com.antigravity.webapp

import com.antigravity.webapp.data.firebase.FirebaseApp
import com.antigravity.webapp.data.firebase.FirebaseAppModule
import com.antigravity.webapp.data.firebase.Firestore
import com.antigravity.webapp.data.firebase.FirestoreModule

// En Wasm, las llamadas a `js()` deben ser property initializers o single-expression functions
// en el top-level (fuera de cualquier clase u objeto).
internal val firebaseConfigJsObj: JsAny = js("""
    ({
        apiKey: window.env_API_KEY || '',
        appId: window.env_APP_ID || '',
        projectId: window.env_PROJECT_ID || ''
    })
""")

object FirebaseConfig {
    var app: FirebaseApp? = null
        private set
        
    var firestore: Firestore? = null
        private set

    fun initialize() {
        try {
            app = FirebaseAppModule.initializeApp(firebaseConfigJsObj)
            firestore = FirestoreModule.getFirestore(app!!)
            
            println("Firebase nativo (JS Interop) inicializado en Wasm.")
        } catch (e: Exception) {
            println("Error al inicializar Firebase JS Interop: ${e.message}")
        }
    }
}

// Helper para main()
fun initializeFirebase() {
    FirebaseConfig.initialize()
}
