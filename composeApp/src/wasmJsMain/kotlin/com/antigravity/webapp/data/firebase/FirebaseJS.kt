package com.antigravity.webapp.data.firebase

/**
 * Kotlin/Wasm Interop bindings para el SDK Oficial de Firebase JS (Modular v9/v10).
 * 
 * En Kotlin/Wasm, usamos funciones externas (`external fun`) para mapear el código
 * JS del navegador hacia el mundo estático de Kotlin.
 */

// --- Firebase Core ---

// Las interfaces externas en Wasm deben heredar de JsAny
external interface FirebaseApp : JsAny

@JsModule("firebase/app")
external object FirebaseAppModule {
    fun initializeApp(options: JsAny): FirebaseApp
}

// --- Firestore ---

// Las interfaces externas en Wasm deben heredar de JsAny
external interface Firestore : JsAny
external interface QuerySnapshot : JsAny
external interface DocumentSnapshot : JsAny
external interface QueryDocumentSnapshot : DocumentSnapshot {
    fun data(): JsAny // Devuelve un objeto JS puro
    val id: String
}

@JsModule("firebase/firestore")
external object FirestoreModule {
    fun getFirestore(app: FirebaseApp): Firestore
    fun collection(firestore: Firestore, path: String): JsAny // Retorna CollectionReference
    fun onSnapshot(
        query: JsAny, 
        onNext: (QuerySnapshot) -> Unit, 
        onError: (JsAny) -> Unit
    ): JsAny // Retorna función de desuscripción. Cambiado de () -> Unit a JsAny para compatibilidad.

    fun enableIndexedDbPersistence(firestore: Firestore): kotlin.js.Promise<JsAny>
}

// En Kotlin/Wasm, las lambdas que se pasan o devuelven a JS no se traducen
// de forma transparente a funciones () -> Unit. Debemos llamar a las funciones JS devueltas así:
internal fun callUnsubscribe(unsubscribeFn: JsAny) {
    js("unsubscribeFn()")
}

// Extensión temporal manual hasta Kotlin 2.x Wasm JsArray full interop
@JsName("getDocsArray")
internal fun getDocsArray(snapshot: QuerySnapshot): JsArray<QueryDocumentSnapshot> =
    js("snapshot.docs")
