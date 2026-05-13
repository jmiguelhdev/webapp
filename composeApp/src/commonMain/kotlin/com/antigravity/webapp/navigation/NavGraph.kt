package com.antigravity.webapp.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.antigravity.webapp.ui.PlaceholderScreen
import com.antigravity.webapp.ui.home.HomeScreen
import com.antigravity.webapp.ui.login.LoginScreen
import com.antigravity.webapp.ui.travels.TravelsScreen
import org.koin.compose.viewmodel.koinViewModel

@Composable
fun AppNavGraph(
    navController: NavHostController,
    startDestination: String = "home"
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // --- Auth ---
        composable("login") {
            LoginScreen(
                viewModel = koinViewModel(),
                onLoginSuccess = {
                    navController.navigate("home") {
                        popUpTo("login") { inclusive = true } // Eliminar login del historial
                    }
                }
            )
        }

        // --- Main App ---
        composable("home") {
            HomeScreen(viewModel = koinViewModel())
        }
        
        composable("travels") { 
            TravelsScreen(viewModel = koinViewModel()) 
        }
        
        // Screens from sidebar
        composable("master-data") { PlaceholderScreen("Datos Maestros") }
        composable("logistics-liquidations") { PlaceholderScreen("Liquidación Choferes") }
        composable("logistics-fuel") { PlaceholderScreen("Rendimiento Combustible") }
        composable("consumption") { PlaceholderScreen("Despacho y Stock") }
        composable("simulator") { PlaceholderScreen("Simulador de Costos") }
        composable("price-share") { PlaceholderScreen("Placa de Precios") }
        composable("checks") { PlaceholderScreen("Gestión de Cheques") }
        composable("accounting") { PlaceholderScreen("Caja General") }
        composable("frigorifico") { PlaceholderScreen("Caja Frigorífico") }
        composable("clients") { PlaceholderScreen("Clientes y Cuentas") }
        composable("establishments") { PlaceholderScreen("Sucursales y Personal") }
        composable("settings") { PlaceholderScreen("Configuración") }
        composable("contact") { PlaceholderScreen("Info y Contacto") }
    }
}
