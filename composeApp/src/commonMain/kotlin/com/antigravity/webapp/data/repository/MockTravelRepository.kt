package com.antigravity.webapp.data.repository

import com.antigravity.webapp.domain.models.Travel
import com.antigravity.webapp.domain.models.TravelStatus
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

/**
 * Repositorio falso (mock) para evitar que la aplicación se congele
 * si hay problemas con JS Interop o si Firebase no responde correctamente en Wasm.
 */
class MockTravelRepository : TravelRepository {
    override fun getTravels(): Flow<Result<List<Travel>>> = flow {
        // Simulamos un tiempo de carga de red
        delay(1000)
        
        val mockData = listOf(
            Travel(
                id = "1", 
                date = "2024-05-12",
                description = "Traslado Hacienda a Liniers", 
                truckName = "Scania AB123CD",
                status = TravelStatus.ACTIVE,
                kmOnOrigin = 10000,
                kmOnDestination = 10500,
                pricePerKm = 1200.0
            ),
            Travel(
                id = "2", 
                description = "Regreso en vacío", 
                truckName = "Volvo EF456GH",
                status = TravelStatus.DRAFT,
                kmOnOrigin = 500,
                kmOnDestination = 600,
                pricePerKm = 1000.0
            ),
            Travel(
                id = "3", 
                description = "Viaje a Rosario", 
                truckName = "Mercedes QW789ER",
                status = TravelStatus.COMPLETED,
                kmOnOrigin = 2000,
                kmOnDestination = 2400,
                pricePerKm = 1100.0
            )
        )
        
        emit(Result.success(mockData))
    }
}
