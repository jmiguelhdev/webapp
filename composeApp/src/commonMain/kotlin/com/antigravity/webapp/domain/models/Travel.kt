package com.antigravity.webapp.domain.models

/**
 * Domain model para un Viaje (Travel).
 * Esta clase NO sabe nada de Firebase ni de base de datos.
 * Solo contiene la estructura pura y las reglas de negocio/cálculos.
 */
data class Travel(
    val id: String = "",
    val date: String = "",
    val description: String = "",
    val status: TravelStatus = TravelStatus.DRAFT,
    val truckName: String = "",
    val kmOnOrigin: Int = 0,
    val kmOnDestination: Int = 0,
    val pricePerKm: Double = 0.0,
    val litersOnPump: Double = 0.0,
    val fuelPrice: Double = 0.0
) {
    // Computed properties - Reglas de Negocio extraídas del JS
    
    val distanceKm: Int
        get() = maxOf(0, kmOnDestination - kmOnOrigin)

    val fleteCost: Double
        get() = distanceKm * pricePerKm

    val isCompleted: Boolean
        get() = status == TravelStatus.ACTIVE || status == TravelStatus.COMPLETED
}

enum class TravelStatus {
    DRAFT, ACTIVE, COMPLETED
}
