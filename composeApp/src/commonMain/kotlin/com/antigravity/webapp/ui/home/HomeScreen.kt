package com.antigravity.webapp.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.ui.tooling.preview.Preview

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    modifier: Modifier = Modifier
) {
    val state by viewModel.state.collectAsState()

    HomeContent(
        state = state,
        onAction = viewModel::onAction,
        modifier = modifier
    )
}

@Composable
private fun HomeContent(
    state: HomeState,
    onAction: (HomeAction) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if (state.isLoading) {
            CircularProgressIndicator()
        } else {
            Text(text = state.title)
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = { onAction(HomeAction.OnRefreshClick) },
            enabled = !state.isLoading
        ) {
            Text(text = "Actualizar")
        }
    }
}

// --- Previews ---

@Preview
@Composable
private fun HomeContentPreview_Normal() {
    MaterialTheme {
        Surface {
            HomeContent(
                state = HomeState(
                    isLoading = false,
                    title = "Bienvenido a Antigravity Web"
                ),
                onAction = {}
            )
        }
    }
}

@Preview
@Composable
private fun HomeContentPreview_Loading() {
    MaterialTheme {
        Surface {
            HomeContent(
                state = HomeState(
                    isLoading = true,
                    title = "Cargando..."
                ),
                onAction = {}
            )
        }
    }
}
