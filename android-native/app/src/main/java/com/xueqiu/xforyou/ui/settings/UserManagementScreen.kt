package com.xueqiu.xforyou.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.xueqiu.xforyou.data.model.MonitorUser

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserManagementScreen(
    modifier: Modifier = Modifier,
    viewModel: UserManagementViewModel = hiltViewModel()
) {
    val twitterUsers by viewModel.twitterUsers
    val xueqiuUsers by viewModel.xueqiuUsers
    val isLoading by viewModel.isLoading
    val error by viewModel.error
    val successMessage by viewModel.successMessage

    // 提示信息
    LaunchedEffect(error, successMessage) {
        if (error != null || successMessage != null) {
            kotlinx.coroutines.delay(3000)
            viewModel.clearError()
            viewModel.clearSuccessMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("👥 用户管理") }
            )
        },
        snackbarHost = {
            SnackbarHost(hostState = remember { SnackbarHostState() }.apply {
                error?.let { showSnackbar(it) }
                successMessage?.let { showSnackbar(it) }
            })
        }
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            // 雪球用户管理
            PlatformUserSection(
                title = "❄️ 雪球",
                users = xueqiuUsers,
                placeholder = "输入雪球用户ID（仅数字，如 7433300125）",
                onAddUser = { viewModel.addXueqiuUser(it) },
                onDeleteUser = { viewModel.deleteXueqiuUser(it) },
                onSync = { viewModel.syncXueqiu() },
                isSyncing = isLoading,
                showPostCount = true
            )

            // Twitter 用户管理
            PlatformUserSection(
                title = "🐦 Twitter",
                users = twitterUsers,
                placeholder = "输入 Twitter 用户的数字 ID 或 @handle",
                onAddUser = { viewModel.addTwitterUser(it) },
                onDeleteUser = { viewModel.deleteTwitterUser(it) },
                onSync = { viewModel.syncTwitter() },
                isSyncing = isLoading,
                showBio = true
            )

            Spacer(modifier = Modifier.height(16.dp))
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
private fun PlatformUserSection(
    title: String,
    users: List<MonitorUser>,
    placeholder: String,
    onAddUser: (String) -> Unit,
    onDeleteUser: (String) -> Unit,
    onSync: () -> Unit,
    isSyncing: Boolean,
    showPostCount: Boolean = false,
    showBio: Boolean = false
) {
    var newUserId by remember { mutableStateOf("") }

    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 平台标题 + 添加表单（内联）
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.width(60.dp)
                )

                OutlinedTextField(
                    value = newUserId,
                    onValueChange = { newUserId = it },
                    placeholder = { Text(placeholder, style = MaterialTheme.typography.bodySmall) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Done
                    )
                )

                Button(
                    onClick = {
                        if (newUserId.isNotBlank()) {
                            onAddUser(newUserId)
                            newUserId = ""
                        }
                    },
                    enabled = newUserId.isNotBlank()
                ) {
                    Text("添加")
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // 列表标题栏
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "监控用户列表 (${users.size} 个)",
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.weight(1f)
                )

                Button(
                    onClick = onSync,
                    enabled = !isSyncing,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.secondary
                    )
                ) {
                    Text(if (isSyncing) "🔄 同步中..." else "🔄 立即同步")
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 用户列表（表格样式）
            if (users.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "暂无监控用户，请在上方添加",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    )
                ) {
                    Column {
                        // 表头
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "用户ID",
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.weight(0.3f)
                            )
                            Text(
                                text = "用户名",
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.weight(0.35f)
                            )
                            if (showPostCount) {
                                Text(
                                    text = "帖子数",
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier.weight(0.2f)
                                )
                            } else if (showBio) {
                                Text(
                                    text = "Bio",
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier.weight(0.2f)
                                )
                            }
                            Box(
                                modifier = Modifier.weight(0.15f),
                                contentAlignment = Alignment.CenterEnd
                            ) {
                                Text(
                                    text = "操作",
                                    style = MaterialTheme.typography.labelSmall
                                )
                            }
                        }

                        HorizontalDivider()

                        // 用户行
                        users.forEachIndexed { index, user ->
                            UserTableRow(
                                user = user,
                                onDelete = { onDeleteUser(user.user_id ?: "") },
                                showPostCount = showPostCount,
                                showBio = showBio
                            )
                            if (index < users.size - 1) {
                                HorizontalDivider()
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun UserTableRow(
    user: MonitorUser,
    onDelete: () -> Unit,
    showPostCount: Boolean,
    showBio: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // 用户ID
        Text(
            text = user.user_id ?: "-",
            style = MaterialTheme.typography.bodySmall,
            fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
            modifier = Modifier.weight(0.3f)
        )

        // 用户名
        Text(
            text = user.screen_name ?: "-",
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.weight(0.35f),
            maxLines = 1
        )

        // 帖子数或 Bio
        if (showPostCount) {
            Text(
                text = "${user.postCount ?: 0}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.weight(0.2f)
            )
        } else if (showBio) {
            Text(
                text = user.description?.take(12) ?: "-",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.weight(0.2f),
                maxLines = 1
            )
        }

        // 删除按钮
        Box(
            modifier = Modifier.weight(0.15f),
            contentAlignment = Alignment.CenterEnd
        ) {
            TextButton(
                onClick = onDelete,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = MaterialTheme.colorScheme.error
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "删除",
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("删除", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
