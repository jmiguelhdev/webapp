package com.antigravity.webapp.data.repository

import com.antigravity.webapp.data.firebase.*
import com.antigravity.webapp.domain.models.Travel
import com.antigravity.webapp.domain.models.TravelStatus
import com.antigravity.webapp.FirebaseConfig
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

class WasmTravelRepository : TravelRepository {

    override fun getTravels(): Flow<Result<List<Travel>>> = callbackFlow {
        if (FirebaseConfig.firestore == null) {
            trySend(Result.failure(Exception("Firestore not initialized")))
            close()
            return@callbackFlow
        }

        // El nombre de la colección en Firestore es 'travels'
        val collectionRef = FirestoreModule.collection(FirebaseConfig.firestore!!, "travels")

        val unsubscribeJsFn = FirestoreModule.onSnapshot(
            query = collectionRef,
            onNext = { snapshot ->
                try {
                    val docsArray = getDocsArray(snapshot)
                    val travelsList = mutableListOf<Travel>()
                    
                    for (i in 0 until docsArray.length) {
                        val doc = docsArray[i]
                        val data = doc?.data()
                        
                        if (doc != null && data != null) {
                            travelsList.add(parseJsToTravel(doc.id, data))
                        }
                    }
                    
                    trySend(Result.success(travelsList))
                } catch (e: Exception) {
                    println("Error al procesar snapshot de viajes: ${e.message}")
                    trySend(Result.failure(e))
                }
            },
            onError = { jsError ->
                println("Error de Firestore en Wasm: $jsError")
                trySend(Result.failure(Exception("Firestore snapshot error")))
            }
        )

        awaitClose {
            callUnsubscribe(unsubscribeJsFn)
        }
    }

    /**
     * Helper nativo Wasm para parsear el JS dinámico al data class estático de Kotlin.
     * Mantenemos la lógica de la app original: mergear campos de nivel superior con el JSON 'data'.
     */
    private fun parseJsToTravel(docId: String, jsData: JsAny): Travel {
        // 1. Obtener el JSON string del campo 'data' (si existe)
        val rawDataString = getJsString(jsData, "data")
        val parsedData: JsAny? = if (rawDataString.isNotEmpty()) {
            try {
                parseJson(rawDataString)
            } catch (e: Exception) {
                null
            }
        } else null

        // 2. Función auxiliar para buscar en el objeto parseado y luego en el top-level
        fun getString(key: String): String {
            val fromParsed = if (parsedData != null) getJsString(parsedData, key) else ""
            return if (fromParsed.isNotEmpty()) fromParsed else getJsString(jsData, key)
        }

        fun getInt(key: String): Int {
            val fromParsed = if (parsedData != null) getJsInt(parsedData, key) else -1
            return if (fromParsed != -1) fromParsed else getJsInt(jsData, key)
        }

        fun getDouble(key: String): Double {
            val fromParsed = if (parsedData != null) getJsDouble(parsedData, key) else -1.0
            val topLevel = getJsDouble(jsData, key)
            return if (fromParsed != -1.0) fromParsed else topLevel
        }

        val firebaseId = getString("firebaseId").takeIf { it.isNotEmpty() }
        val idFallback = getString("id").takeIf { it.isNotEmpty() }
        val finalId = firebaseId ?: idFallback ?: docId

        val rawStatus = getString("status").uppercase()
        val mappedStatus = when (rawStatus) {
            "ACTIVE", "ACTIVO" -> TravelStatus.ACTIVE
            "COMPLETED", "FINALIZADO" -> TravelStatus.COMPLETED
            else -> TravelStatus.DRAFT
        }

        // Manejo de objeto truck
        val truckObjFromParsed = if (parsedData != null) getJsObj(parsedData, "truck") else null
        val truckObj = truckObjFromParsed ?: getJsObj(jsData, "truck")
        val truckName = if (truckObj != null) getJsString(truckObj, "name") else ""

        return Travel(
            id = finalId,
            date = getString("date"),
            description = getString("description"),
            status = mappedStatus,
            truckName = truckName,
            kmOnOrigin = getInt("kmOnOrigin").coerceAtLeast(0),
            kmOnDestination = getInt("kmOnDestination").coerceAtLeast(0),
            pricePerKm = getDouble("pricePerKm").coerceAtLeast(0.0),
            litersOnPump = getDouble("litersOnPump").coerceAtLeast(0.0),
            fuelPrice = getDouble("fuelPrice").coerceAtLeast(0.0)
        )
    }
}

// === Funciones top-level auxiliares de Wasm JS ===

internal fun parseJson(json: String): JsAny =
    js("JSON.parse(json)")

internal fun getJsString(obj: JsAny, key: String): String =
    js("obj[key] ? String(obj[key]) : ''")

internal fun getJsInt(obj: JsAny, key: String): Int =
    js("obj[key] ? Number(obj[key]) : 0")

internal fun getJsDouble(obj: JsAny, key: String): Double =
    js("obj[key] ? Number(obj[key]) : 0.0")

internal fun getJsObj(obj: JsAny, key: String): JsAny? =
    js("obj[key]")
