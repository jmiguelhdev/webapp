package com.antigravity.webapp.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.ui.tooling.preview.Preview

// Forma con un pequeño corte en la esquina superior derecha (o donde prefieras)
val SlantedCornerShape = CutCornerShape(topStart = 0.dp, topEnd = 16.dp, bottomEnd = 0.dp, bottomStart = 0.dp)

/**
 * PiolaCard: Tarjeta personalizada con estética de la marca.
 * Incluye el corte inclinado (SlantedShape) y una barra lateral de acento.
 */
@Composable
fun PiolaCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    isSelected: Boolean = false,
    accentColor: Color = MaterialTheme.colorScheme.primary,
    content: @Composable ColumnScope.() -> Unit
) {
    val containerColor = if (isSelected) {
        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.1f)
    } else {
        MaterialTheme.colorScheme.surface
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .then(
                if (onClick != null) Modifier.clickable { onClick() } else Modifier
            ),
        shape = SlantedCornerShape,
        colors = CardDefaults.cardColors(containerColor = containerColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ){
        // Usamos Box para superponer la barra lateral sin requerir IntrinsicSize.Min
        // (lo cual causaba errores con SubcomposeLayout como BoxWithConstraints)
        Box {
            Row(modifier = Modifier.fillMaxWidth()) {
                // Margen izquierdo para la barra de acento
                Spacer(modifier = Modifier.width(8.dp))
                
                Column(
                    modifier = Modifier
                        .padding(16.dp)
                        .fillMaxWidth(),
                    content = content
                )
            }
            
            // Barra lateral de acento: 
            // matchParentSize() hace que este contenedor ocupe el alto determinado por el Row anterior.
            Box(modifier = Modifier.matchParentSize()) {
                Box(
                    modifier = Modifier
                        .width(8.dp)
                        .fillMaxHeight()
                        .clip(SlantedCornerShape)
                        .background(if (isSelected) accentColor else accentColor.copy(alpha = 0.4f))
                )
            }
        }
    }
}

@Preview
@Composable
fun PiolaCardPreview() {
    MaterialTheme {
        Surface(color = MaterialTheme.colorScheme.background) {
            Column(modifier = Modifier.padding(16.dp)) {
                PiolaCard(isSelected = false) {
                    Text("Tarjeta Normal", style = MaterialTheme.typography.titleMedium)
                    Text("Contenido de ejemplo para la tarjeta Piola.", style = MaterialTheme.typography.bodyMedium)
                }
                Box(modifier = Modifier.height(16.dp))
                PiolaCard(isSelected = true) {
                    Text("Tarjeta Seleccionada", style = MaterialTheme.typography.titleMedium)
                    Text("Este es el estado seleccionado.", style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}
