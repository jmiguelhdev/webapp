package com.antigravity.webapp.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.ui.tooling.preview.Preview

data class MenuItem(
    val route: String,
    val label: String,
    val icon: ImageVector,
    val roles: List<String>
)

val MainMenuItems = listOf(
    MenuItem("home", "Dashboard", Icons.Default.Home, listOf("ADMIN", "OPERARIO", "VISOR")),
    MenuItem("travels", "Gestión de Viajes", Icons.Default.LocalShipping, listOf("ADMIN", "OPERARIO", "VISOR")),
    MenuItem("master-data", "Datos Maestros", Icons.Default.Analytics, listOf("ADMIN")),
    MenuItem("logistics-liquidations", "Liquidación Choferes", Icons.Default.Payments, listOf("ADMIN", "OPERARIO")),
    MenuItem("logistics-fuel", "Rendimiento Combustible", Icons.Default.LocalGasStation, listOf("ADMIN", "OPERARIO")),
    MenuItem("consumption", "Despacho y Stock", Icons.Default.Inventory, listOf("ADMIN", "OPERARIO")),
    MenuItem("simulator", "Simulador de Costos", Icons.Default.Calculate, listOf("ADMIN", "OPERARIO", "VISOR")),
    MenuItem("price-share", "Placa de Precios", Icons.Default.PriceChange, listOf("ADMIN", "OPERARIO")),
    MenuItem("checks", "Gestión de Cheques", Icons.Default.AccountBalanceWallet, listOf("ADMIN", "OPERARIO")),
    MenuItem("accounting", "Caja General", Icons.Default.AccountBalance, listOf("ADMIN", "OPERARIO")),
    MenuItem("frigorifico", "Caja Frigorífico", Icons.Default.Store, listOf("ADMIN", "OPERARIO")),
    MenuItem("clients", "Clientes y Cuentas", Icons.Default.People, listOf("ADMIN")),
    MenuItem("establishments", "Sucursales y Personal", Icons.Default.Store, listOf("ADMIN")),
    MenuItem("settings", "Configuración", Icons.Default.Settings, listOf("ADMIN")),
    MenuItem("contact", "Info y Contacto", Icons.Default.Contacts, listOf("ADMIN", "OPERARIO", "VISOR"))
)

@Composable
fun Sidebar(
    currentRoute: String?,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    userRole: String = "ADMIN",
    modifier: Modifier = Modifier
) {
    val visibleItems = MainMenuItems.filter { it.roles.contains(userRole) }

    Column(
        modifier = modifier
            .width(280.dp)
            .fillMaxHeight()
            .padding(12.dp)
    ) {
        Text(
            text = "Antigravity",
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(vertical = 24.dp, horizontal = 16.dp)
        )

        LazyColumn(
            modifier = Modifier.weight(1f)
        ) {
            items(visibleItems) { item ->
                NavigationDrawerItem(
                    label = { Text(item.label) },
                    icon = { Icon(item.icon, contentDescription = null) },
                    selected = currentRoute == item.route,
                    onClick = { onNavigate(item.route) },
                    modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                )
            }
        }

        Spacer(modifier = Modifier.weight(0.05f))

        // Botón de Logout
        NavigationDrawerItem(
            label = { 
                Text(
                    text = "Cerrar Sesión", 
                    color = MaterialTheme.colorScheme.error 
                ) 
            },
            icon = { 
                Icon(
                    imageVector = Icons.Default.ExitToApp, 
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error
                ) 
            },
            selected = false,
            onClick = onLogout,
            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
        )
    }
}

@Preview
@Composable
private fun SidebarPreview() {
    MaterialTheme {
        Sidebar(
            currentRoute = "home",
            onNavigate = {},
            onLogout = {}
        )
    }
}