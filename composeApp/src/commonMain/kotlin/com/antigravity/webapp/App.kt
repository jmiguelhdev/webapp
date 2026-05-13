package com.antigravity.webapp

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.antigravity.webapp.navigation.AppNavGraph
import com.antigravity.webapp.ui.components.Sidebar

@Composable
fun App() {
    MaterialTheme {
        val navController = rememberNavController()
        val navBackStackEntry by navController.currentBackStackEntryAsState()
        val currentRoute = navBackStackEntry?.destination?.route

        Surface(modifier = Modifier.fillMaxSize()) {
            // El contenedor principal cambia dependiendo de si estamos logueados o no
            // Por simplicidad, si la ruta es "login", ocultamos el Sidebar
            if (currentRoute == "login") {
                AppNavGraph(navController = navController, startDestination = "login")
            } else {
                Row(modifier = Modifier.fillMaxSize()) {
                    
                    // Sidebar siempre visible a la izquierda (estilo Desktop/Web)
                    Sidebar(
                        currentRoute = currentRoute,
                        onNavigate = { route ->
                            navController.navigate(route) {
                                // Evitar múltiples copias de la misma pantalla
                                popUpTo(navController.graph.startDestinationId) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        onLogout = {
                            // Lógica de logout simulada (te lleva al login)
                            navController.navigate("login") {
                                popUpTo(0) // Limpia todo el backstack
                            }
                        }
                    )

                    // Contenedor principal para las pantallas
                    Surface(
                        modifier = Modifier.weight(1f),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        AppNavGraph(navController = navController, startDestination = "home")
                    }
                }
            }
        }
    }
}
