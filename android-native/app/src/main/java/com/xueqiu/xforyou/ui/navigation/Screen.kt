package com.xueqiu.xforyou.ui.navigation

sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Home : Screen("home")
    data object Settings : Screen("settings")
}
