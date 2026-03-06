package com.xueqiu.xforyou.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.xueqiu.xforyou.data.model.MonitorUser

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel(),
    userManagementViewModel: UserManagementViewModel = hiltViewModel()
) {
    val baseUrl by viewModel.baseUrl
    var tempUrl by remember { mutableStateOf(baseUrl) }
    var showSaved by remember { mutableStateOf(false) }

    // 用户管理状态
    val twitterUsers by userManagementViewModel.twitterUsers
    val xueqiuUsers by userManagementViewModel.xueqiuUsers
    val queryIdConfig by userManagementViewModel.queryIdConfig
    val isLoading by userManagementViewModel.isLoading
    val error by userManagementViewModel.error
    val successMessage by userManagementViewModel.successMessage

    // 添加用户对话框状态
    var showAddTwitterDialog by remember { mutableStateOf(false) }
    var showAddXueqiuDialog by remember { mutableStateOf(false) }

    // 提示信息
    LaunchedEffect(error) {
        if (error != null) {
            userManagementViewModel.clearError()
        }
    }

    LaunchedEffect(successMessage) {
        if (successMessage != null) {
            userManagementViewModel.clearSuccessMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("设置") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 后端地址设置
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SettingsSection(title = "后端 API 地址") {
                    OutlinedTextField(
                        value = tempUrl,
                        onValueChange = { tempUrl = it },
                        label = { Text("Base URL") },
                        placeholder = { Text("https://...") },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Uri,
                            imeAction = ImeAction.Done
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                viewModel.saveBaseUrl(tempUrl)
                                showSaved = true
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("保存")
                        }

                        OutlinedButton(
                            onClick = {
                                tempUrl = viewModel.getDefaultBaseUrl()
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("恢复默认")
                        }
                    }

                    if (showSaved) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "已保存，重启应用后生效",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            // Twitter 用户管理
            item {
                SettingsSection(title = "Twitter 监控用户 (${twitterUsers.size})") {
                    // 用户列表
                    twitterUsers.forEach { user ->
                        UserItem(
                            user = user,
                            onDelete = { userManagementViewModel.deleteTwitterUser(user.user_id ?: "") }
                        )
                    }

                    // 添加按钮
                    OutlinedButton(
                        onClick = { showAddTwitterDialog = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("添加用户")
                    }
                }
            }

            // 雪球用户管理
            item {
                SettingsSection(title = "雪球监控用户 (${xueqiuUsers.size})") {
                    // 用户列表
                    xueqiuUsers.forEach { user ->
                        UserItem(
                            user = user,
                            onDelete = { userManagementViewModel.deleteXueqiuUser(user.user_id ?: "") }
                        )
                    }

                    // 添加按钮
                    OutlinedButton(
                        onClick = { showAddXueqiuDialog = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("添加用户")
                    }
                }
            }

            // Query ID 配置
            item {
                SettingsSection(title = "Query ID 配置") {
                    QueryIdField(
                        label = "Home Latest Timeline",
                        value = queryIdConfig?.homeLatestTimelineQueryId ?: "",
                        onUpdate = { userManagementViewModel.updateQueryId("following", it) }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    QueryIdField(
                        label = "User Tweets",
                        value = queryIdConfig?.userTweetsQueryId ?: "",
                        onUpdate = { userManagementViewModel.updateQueryId("user", it) }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    QueryIdField(
                        label = "User By Screen Name",
                        value = queryIdConfig?.userByScreenNameQueryId ?: "",
                        onUpdate = { userManagementViewModel.updateQueryId("userByScreenName", it) }
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }

        // 添加 Twitter 用户对话框
        if (showAddTwitterDialog) {
            AddUserDialog(
                title = "添加 Twitter 用户",
                onDismiss = { showAddTwitterDialog = false },
                onConfirm = { userId ->
                    userManagementViewModel.addTwitterUser(userId)
                    showAddTwitterDialog = false
                }
            )
        }

        // 添加雪球用户对话框
        if (showAddXueqiuDialog) {
            AddUserDialog(
                title = "添加雪球用户",
                onDismiss = { showAddXueqiuDialog = false },
                onConfirm = { userId ->
                    userManagementViewModel.addXueqiuUser(userId)
                    showAddXueqiuDialog = false
                }
            )
        }

        // 加载指示器
        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable () -> Unit
) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                content()
            }
        }
    }
}

@Composable
private fun UserItem(
    user: MonitorUser,
    onDelete: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = user.profile_image_url,
            contentDescription = null,
            modifier = Modifier.size(40.dp)
        )

        Spacer(modifier = Modifier.width(12.dp))

        Column(
            modifier = Modifier.weight(1f)
        ) {
            Text(
                text = user.screen_name ?: "未知用户",
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = "ID: ${user.user_id ?: "-"}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        IconButton(onClick = onDelete) {
            Icon(
                imageVector = Icons.Default.Delete,
                contentDescription = "删除",
                tint = MaterialTheme.colorScheme.error
            )
        }
    }
}

@Composable
private fun QueryIdField(
    label: String,
    value: String,
    onUpdate: (String) -> Unit
) {
    var text by remember { mutableStateOf(value) }

    LaunchedEffect(value) {
        text = value
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        OutlinedTextField(
            value = text,
            onValueChange = { text = it },
            label = { Text(label) },
            modifier = Modifier.weight(1f),
            singleLine = true
        )

        Spacer(modifier = Modifier.width(8.dp))

        Button(
            onClick = { onUpdate(text) },
            enabled = text != value
        ) {
            Text("更新")
        }
    }
}

@Composable
private fun AddUserDialog(
    title: String,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var userId by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            OutlinedTextField(
                value = userId,
                onValueChange = { userId = it },
                label = { Text("用户 ID") },
                placeholder = { Text("输入数字ID或@用户名") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(userId) },
                enabled = userId.isNotBlank()
            ) {
                Text("添加")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}
