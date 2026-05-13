package com.antigravity.webapp.data.mapper

import com.antigravity.webapp.data.dto.TravelDto
import com.antigravity.webapp.domain.models.Travel
import com.antigravity.webapp.domain.models.TravelStatus

/**
 * Mapper para convertir un [TravelDto] a un [Travel] (Dominio).
 * Maneja valores nulos y asigna valores por defecto.
 */
fun TravelDto.toDomain(documentId: String): Travel {
    // Si firebaseId o id vienen nulos en el documento, usamos el documentId
    val finalId = this.firebaseId ?: this.id ?: documentId

    val mappedStatus = when (this.status?.uppercase()) {
        "ACTIVE", "ACTIVO" -> TravelStatus.ACTIVE
        "COMPLETED", "FINALIZADO" -> TravelStatus.COMPLETED
        else -> TravelStatus.DRAFT
    }

    return Travel(
        id = finalId,
        date = this.date.orEmpty(),
        description = this.description.orEmpty(),
        status = mappedStatus,
        truckName = this.truck?.name.orEmpty(),
        kmOnOrigin = this.kmOnOrigin ?: 0,
        kmOnDestination = this.kmOnDestination ?: 0,
        pricePerKm = this.pricePerKm ?: 0.0,
        litersOnPump = this.litersOnPump ?: 0.0,
        fuelPrice = this.fuelPrice ?: 0.0
    )
}