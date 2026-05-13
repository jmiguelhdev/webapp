package com.antigravity.webapp.di

import com.antigravity.webapp.data.repository.TravelRepository
import com.antigravity.webapp.data.repository.WasmTravelRepository
import com.antigravity.webapp.data.repository.AuthRepository
import com.antigravity.webapp.data.repository.WasmAuthRepository
import org.koin.dsl.module

val platformModule = module {
    // Activamos el repositorio real para Wasm
    single<TravelRepository> { WasmTravelRepository() }
    single<AuthRepository> { WasmAuthRepository() }
}
