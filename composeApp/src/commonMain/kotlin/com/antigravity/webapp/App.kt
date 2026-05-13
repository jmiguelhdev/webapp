package com.antigravity.webapp

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.runtime.collectAsState
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.antigravity.webapp.navigation.AppNavGraph
import com.antigravity.webapp.ui.MainViewModel
import com.antigravity.webapp.ui.components.Sidebar
import org.koin.compose.viewmodel.koinViewModel

@Composable
fun App(
    viewModel: MainViewModel = koinViewModel()
) {
    val state by viewModel.state.collectAsState()
    
    MaterialTheme {
        val navController = rememberNavController()
        val navBackStackEntry by navController.currentBackStackEntryAsState()
        val currentRoute = navBackStackEntry?.destination?.route

        Surface(modifier = Modifier.fillMaxSize()) {
            if (state.isLoading) {
                // Pantalla de carga inicial mientras se verifica la sesión
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (state.user == null) {
                // Si NO hay usuario, forzamos la pantalla de login
                AppNavGraph(navController = navController, startDestination = "login")
            } else {
                // Si HAY usuario, mostramos el layout principal con Sidebar
                Row(modifier = Modifier.fillMaxSize()) {
                    
                    Sidebar(
                        currentRoute = currentRoute,
                        onNavigate = { route ->
                            navController.navigate(route) {
                                popUpTo(navController.graph.startDestinationId) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        onLogout = {
                            viewModel.logout()
                        }
                    )

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
