package com.antigravity.webapp.di

import com.antigravity.webapp.data.repository.TravelRepository
import com.antigravity.webapp.data.repository.MockTravelRepository
import com.antigravity.webapp.data.repository.AuthRepository
import com.antigravity.webapp.data.repository.MockAuthRepository
import org.koin.dsl.module

val platformModule = module {
    // CAMBIO TEMPORAL: Usar Mocks en lugar de WasmRepositories
    // para evitar que la app se congele debido a excepciones JS Interop
    single<TravelRepository> { MockTravelRepository() }
    single<AuthRepository> { MockAuthRepository() }
}
