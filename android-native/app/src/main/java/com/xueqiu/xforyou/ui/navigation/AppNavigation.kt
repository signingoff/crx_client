package com.xueqiu.xforyou.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.xueqiu.xforyou.ui.auth.LoginScreen
import com.xueqiu.xforyou.ui.home.HomeScreen
import com.xueqiu.xforyou.ui.settings.SettingsScreen
import com.xueqiu.xforyou.ui.settings.UserManagementScreen

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Screen.Home.route
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.Home.route) {
            MainScreen(
                navController = navController,
                currentRoute = Screen.Home.route
            )
        }

        composable(Screen.Users.route) {
            MainScreen(
                navController = navController,
                currentRoute = Screen.Users.route
            )
        }

        composable(Screen.Settings.route) {
            MainScreen(
                navController = navController,
                currentRoute = Screen.Settings.route
            )
        }
    }
}

@Composable
private fun MainScreen(
    navController: androidx.navigation.NavHostController,
    currentRoute: String
) {
    val items = listOf(
        Triple(Screen.Home, Icons.Default.Home, "首页"),
        Triple(Screen.Users, Icons.Default.People, "用户"),
        Triple(Screen.Settings, Icons.Default.Settings, "设置")
    )

    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("x_foryou_auth", android.content.Context.MODE_PRIVATE) }
    var isLoggedIn by remember { mutableStateOf(prefs.getString("auth_token", null) != null) }

    // 如果需要登录但未登录，跳转到登录页
    LaunchedEffect(currentRoute) {
        if (currentRoute != Screen.Home.route && !isLoggedIn) {
            navController.navigate(Screen.Login.route)
        }
    }

    // 监听登录状态变化（当从登录页返回时）
    DisposableEffect(navController.currentBackStackEntry) {
        val token = prefs.getString("auth_token", null)
        isLoggedIn = token != null
        onDispose { }
    }

    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val destination = navBackStackEntry?.destination

                items.forEach { (screen, icon, label) ->
                    NavigationBarItem(
                        icon = { Icon(icon, contentDescription = label) },
                        label = { Text(label) },
                        selected = destination?.hierarchy?.any { it.route == screen.route } == true,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        when (currentRoute) {
            Screen.Home.route -> HomeScreen(
                modifier = Modifier.padding(innerPadding)
            )
            Screen.Users.route -> {
                if (isLoggedIn) {
                    UserManagementScreen(
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
            Screen.Settings.route -> {
                if (isLoggedIn) {
                    SettingsScreen(
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}
