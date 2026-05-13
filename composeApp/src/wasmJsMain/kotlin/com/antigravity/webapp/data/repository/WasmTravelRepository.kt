package com.antigravity.webapp.data.repository

import com.antigravity.webapp.data.firebase.FirestoreModule
import com.antigravity.webapp.data.firebase.getDocsArray
import com.antigravity.webapp.data.firebase.callUnsubscribe
import com.antigravity.webapp.domain.models.Travel
import com.antigravity.webapp.domain.models.TravelStatus
import com.antigravity.webapp.FirebaseConfig
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

/**
 * Implementación específica para Wasm del repositorio, usando interop JS puro.
 * Aquí implementamos las funciones de la interfaz definida en commonMain.
 */
class WasmTravelRepository : TravelRepository {

    override fun getTravels(): Flow<Result<List<Travel>>> = callbackFlow {
        if (FirebaseConfig.firestore == null) {
            trySend(Result.failure(Exception("Firestore not initialized")))
            close()
            return@callbackFlow
        }

        val collectionRef = FirestoreModule.collection(FirebaseConfig.firestore!!, "viajes")

        val unsubscribeJsFn = FirestoreModule.onSnapshot(
            query = collectionRef,
            onNext = { snapshot ->
                try {
                    val docsArray = getDocsArray(snapshot)
                    val travelsList = mutableListOf<Travel>()
                    
                    // Iteramos el JsArray de forma manual para Wasm
                    for (i in 0 until docsArray.length) {
                        val doc = docsArray[i]
                        val data = doc?.data()
                        
                        if (doc != null && data != null) {
                            travelsList.add(parseJsToTravel(doc.id, data))
                        }
                    }
                    
                    trySend(Result.success(travelsList))
                } catch (e: Exception) {
                    trySend(Result.failure(e))
                }
            },
            onError = { jsError ->
                trySend(Result.failure(Exception("Firestore snapshot error")))
            }
        )

        awaitClose {
            callUnsubscribe(unsubscribeJsFn)
        }
    }

    /**
     * Helper nativo Wasm para parsear el JS dinámico al data class estático de Kotlin.
     */
    private fun parseJsToTravel(docId: String, jsData: JsAny): Travel {
        val firebaseId = getJsString(jsData, "firebaseId").takeIf { it.isNotEmpty() }
        val idFallback = getJsString(jsData, "id").takeIf { it.isNotEmpty() }
        val finalId = firebaseId ?: idFallback ?: docId

        val rawStatus = getJsString(jsData, "status").uppercase()
        val mappedStatus = when (rawStatus) {
            "ACTIVE", "ACTIVO" -> TravelStatus.ACTIVE
            "COMPLETED", "FINALIZADO" -> TravelStatus.COMPLETED
            else -> TravelStatus.DRAFT
        }

        val truckObj = getJsObj(jsData, "truck")
        val truckName = if (truckObj != null) getJsString(truckObj, "name") else ""

        return Travel(
            id = finalId,
            date = getJsString(jsData, "date"),
            description = getJsString(jsData, "description"),
            status = mappedStatus,
            truckName = truckName,
            kmOnOrigin = getJsInt(jsData, "kmOnOrigin"),
            kmOnDestination = getJsInt(jsData, "kmOnDestination"),
            pricePerKm = getJsDouble(jsData, "pricePerKm"),
            litersOnPump = getJsDouble(jsData, "litersOnPump"),
            fuelPrice = getJsDouble(jsData, "fuelPrice")
        )
    }
}

// === Funciones top-level auxiliares de Wasm JS ===
// En Wasm, `js("...")` solo está permitido en funciones top-level.

internal fun getJsString(obj: JsAny, key: String): String =
    js("obj[key] ? String(obj[key]) : ''")

internal fun getJsInt(obj: JsAny, key: String): Int =
    js("obj[key] ? Number(obj[key]) : 0")

internal fun getJsDouble(obj: JsAny, key: String): Double =
    js("obj[key] ? Number(obj[key]) : 0.0")

internal fun getJsObj(obj: JsAny, key: String): JsAny? =
    js("obj[key]")
