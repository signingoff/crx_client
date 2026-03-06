package com.xueqiu.xforyou.ui.navigation

sealed class Screen(val route: String, val title: String? = null) {
    data object Login : Screen("login")
    data object Home : Screen("home", "首页")
    data object Users : Screen("users", "用户")
    data object Settings : Screen("settings", "设置")
}
