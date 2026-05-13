package com.antigravity.webapp

import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.window.ComposeViewport
import com.antigravity.webapp.di.appModule
import kotlinx.browser.document
import org.koin.core.context.startKoin

@OptIn(ExperimentalComposeUiApi::class)
fun main() {
    // Inicializar la base de datos y autenticación de Firebase
    initializeFirebase()

    // Inicializar el grafo de dependencias de Koin
    startKoin {
        modules(appModule)
    }

    // Levantar la UI de Compose Multiplatform
    ComposeViewport(document.body!!) {
        App()
    }
}