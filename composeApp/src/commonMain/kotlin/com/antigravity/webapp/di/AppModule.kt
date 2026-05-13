package com.antigravity.webapp.di

import com.antigravity.webapp.ui.home.HomeViewModel
import com.antigravity.webapp.ui.login.LoginViewModel
import com.antigravity.webapp.ui.travels.TravelsViewModel
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

val appModule = module {
    // ViewModels
    // Note: Repositories are provided by the PlatformModule in the Wasm source set.
    viewModel { HomeViewModel() }
    viewModel { TravelsViewModel(get()) }
    viewModel { LoginViewModel(get()) }
}
