package com.antigravity.webapp.data.repository

import com.antigravity.webapp.domain.models.Travel
import kotlinx.coroutines.flow.Flow

/**
 * Interfaz del Repositorio.
 * La implementación real vivirá en wasmJsMain (usando Firebase JS SDK)
 * o en otras plataformas usando sus SDKs nativos.
 */
interface TravelRepository {
    fun getTravels(): Flow<Result<List<Travel>>>
}
