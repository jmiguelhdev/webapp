package com.antigravity.webapp.data.dto

import kotlinx.serialization.Serializable

/**
 * Data Transfer Object (DTO) para Firebase Firestore.
 * Solo contiene datos en bruto, tal cual vienen de la base de datos.
 */
@Serializable
data class TravelDto(
    val firebaseId: String? = null,
    val id: String? = null,
    val date: String? = null,
    val description: String? = null,
    val status: String? = null,
    val truck: TruckDto? = null,
    val kmOnOrigin: Int? = null,
    val kmOnDestination: Int? = null,
    val pricePerKm: Double? = null,
    val litersOnPump: Double? = null,
    val fuelPrice: Double? = null
)

@Serializable
data class TruckDto(
    val name: String? = null
)
