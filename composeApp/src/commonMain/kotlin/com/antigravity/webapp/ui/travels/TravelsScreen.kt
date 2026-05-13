package com.antigravity.webapp.ui.travels

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.antigravity.webapp.domain.models.Travel
import com.antigravity.webapp.domain.models.TravelStatus
import com.antigravity.webapp.ui.components.PiolaCard
import org.jetbrains.compose.ui.tooling.preview.Preview

@Composable
fun TravelsScreen(
    viewModel: TravelsViewModel,
    modifier: Modifier = Modifier
) {
    println("[DEBUG_TRAVELS] Screen: TravelsScreen recomposing")
    val state by viewModel.state.collectAsState()

    TravelsContent(
        state = state,
        onAction = viewModel::onAction,
        modifier = modifier
    )
}

@Composable
private fun TravelsContent(
    state: TravelsState,
    onAction: (TravelsAction) -> Unit,
    modifier: Modifier = Modifier
) {
    println("[DEBUG_TRAVELS] Screen: TravelsContent recomposing with ${state.travels.size} travels")
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        // --- Header ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "🚛 Gestión de Viajes",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Button(onClick = { onAction(TravelsAction.OnAddNewTravel) }) {
                Icon(Icons.Default.Add, contentDescription = "Nuevo Viaje")
                Spacer(Modifier.width(8.dp))
                Text("Nuevo Viaje")
            }
        }

        Spacer(modifier = Modifier.size(24.dp))

        // --- Toolbar (Search & Filters) ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Filters
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TravelFilter.entries.forEach { filter ->
                    FilterChip(
                        selected = state.currentFilter == filter,
                        onClick = { onAction(TravelsAction.OnFilterChanged(filter)) },
                        label = { Text(filter.name) }
                    )
                }
            }

            // Search
            OutlinedTextField(
                value = state.searchQuery,
                onValueChange = { onAction(TravelsAction.OnSearchQueryChanged(it)) },
                placeholder = { Text("Buscar por patente o descripción...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier.width(300.dp),
                shape = RoundedCornerShape(12.dp)
            )
        }

        Spacer(modifier = Modifier.size(16.dp))

        // --- List Content ---
        Box(modifier = Modifier.fillMaxSize()) {
            when {
                state.isLoading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                state.error != null -> {
                    Text(
                        text = "Error: ${state.error}",
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                state.travels.isEmpty() -> {
                    Text(
                        text = "No se encontraron viajes",
                        style = MaterialTheme.typography.bodyLarge,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(state.travels, key = { it.id }) { travel ->
                            TravelCard(
                                travel = travel,
                                onEditClick = { onAction(TravelsAction.OnTravelClick(travel.id)) },
                                onDeleteClick = { /* Emitir intención de borrar */ }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TravelCard(
    travel: Travel,
    onEditClick: () -> Unit,
    onDeleteClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    println("[DEBUG_TRAVELS] Screen: Rendering TravelCard for ID: ${travel.id}")
    // Usamos el nuevo componente PiolaCard en lugar del Card genérico de Material3
    PiolaCard(
        modifier = modifier.fillMaxWidth(),
        isSelected = travel.status == TravelStatus.ACTIVE,
        accentColor = when (travel.status) {
            TravelStatus.ACTIVE -> Color(0xFF10B981) // Verde
            TravelStatus.COMPLETED -> Color(0xFF3B82F6) // Azul
            TravelStatus.DRAFT -> Color(0xFF6B7280) // Gris
        }
    ) {
        // Header: Titulo y Estado
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = travel.truckName.ifEmpty { "Viaje #${travel.id}" },
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                if (travel.date.isNotEmpty() || travel.description.isNotEmpty()) {
                    Text(
                        text = "${travel.date} - ${travel.description}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatusBadge(status = travel.status)

                IconButton(onClick = onEditClick) {
                    Icon(Icons.Default.Edit, contentDescription = "Editar", tint = MaterialTheme.colorScheme.primary)
                }
                IconButton(onClick = onDeleteClick) {
                    Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = MaterialTheme.colorScheme.error)
                }
            }
        }

        Spacer(modifier = Modifier.size(16.dp))

        // Body: Data Grid
        Row(modifier = Modifier.fillMaxWidth()) {
            // Columna 1: Odómetro
            Column(modifier = Modifier.weight(1f)) {
                Text("Odómetro", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.size(4.dp))
                Text("Origen: ${travel.kmOnOrigin} km", style = MaterialTheme.typography.bodySmall)
                Text("Destino: ${travel.kmOnDestination} km", style = MaterialTheme.typography.bodySmall)
                Text(
                    text = "Recorrido: ${travel.distanceKm} km", 
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            // Columna 2: Flete
            Column(modifier = Modifier.weight(1f)) {
                Text("Economía", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.size(4.dp))
                Text("Precio x Km: $${travel.pricePerKm}", style = MaterialTheme.typography.bodySmall)
                Text(
                    text = "Costo Flete: $${travel.fleteCost}", 
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun StatusBadge(status: TravelStatus) {
    val (bgColor, textColor, label) = when (status) {
        TravelStatus.ACTIVE -> Triple(Color(0xFFE8F5E9), Color(0xFF10B981), "ACTIVO")
        TravelStatus.COMPLETED -> Triple(Color(0xFFE0E7FF), Color(0xFF3B82F6), "FINALIZADO")
        TravelStatus.DRAFT -> Triple(Color(0xFFF3F4F6), Color(0xFF6B7280), "BORRADOR")
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .border(1.dp, textColor.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = label,
            color = textColor,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold
        )
    }
}

// --- Previews ---

@Preview
@Composable
private fun TravelsContentPreview_Loaded() {
    MaterialTheme {
        Surface {
            TravelsContent(
                state = TravelsState(
                    isLoading = false,
                    travels = listOf(
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
                            status = TravelStatus.DRAFT
                        )
                    )
                ),
                onAction = {}
            )
        }
    }
}

@Preview
@Composable
private fun TravelsContentPreview_Empty() {
    MaterialTheme {
        Surface {
            TravelsContent(
                state = TravelsState(isLoading = false, travels = emptyList()),
                onAction = {}
            )
        }
    }
}