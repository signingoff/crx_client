package com.xueqiu.xforyou.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    modifier: Modifier = Modifier,
    viewModel: SettingsViewModel = hiltViewModel(),
    userManagementViewModel: UserManagementViewModel = hiltViewModel()
) {
    val baseUrl by viewModel.baseUrl
    var tempUrl by remember { mutableStateOf(baseUrl) }
    var showSaved by remember { mutableStateOf(false) }

    // Query ID 配置
    val queryIdConfig by userManagementViewModel.queryIdConfig
    var followingQueryId by remember { mutableStateOf("") }
    var userTweetsQueryId by remember { mutableStateOf("") }
    var userByScreenNameQueryId by remember { mutableStateOf("") }

    // 同步 Query ID 到临时状态
    LaunchedEffect(queryIdConfig) {
        queryIdConfig?.let {
            followingQueryId = it.homeLatestTimelineQueryId ?: ""
            userTweetsQueryId = it.userTweetsQueryId ?: ""
            userByScreenNameQueryId = it.userByScreenNameQueryId ?: ""
        }
    }

    val isLoading by userManagementViewModel.isLoading
    val error by userManagementViewModel.error
    val successMessage by userManagementViewModel.successMessage

    // 提示信息
    LaunchedEffect(error, successMessage) {
        if (error != null || successMessage != null) {
            kotlinx.coroutines.delay(3000)
            userManagementViewModel.clearError()
            userManagementViewModel.clearSuccessMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("⚙️ 设置") }
            )
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

            // 后端地址设置
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
                        Text("💾 保存")
                    }

                    OutlinedButton(
                        onClick = { tempUrl = viewModel.getDefaultBaseUrl() },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("恢复默认")
                    }
                }

                if (showSaved) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "✅ 已保存，重启应用后生效",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            // Query ID 配置
            SettingsSection(title = "Query ID 配置") {
                OutlinedTextField(
                    value = followingQueryId,
                    onValueChange = { followingQueryId = it },
                    label = { Text("Following Query ID") },
                    placeholder = { Text("输入 Query ID...") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = userTweetsQueryId,
                    onValueChange = { userTweetsQueryId = it },
                    label = { Text("User Tweets Query ID") },
                    placeholder = { Text("输入 Query ID...") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = userByScreenNameQueryId,
                    onValueChange = { userByScreenNameQueryId = it },
                    label = { Text("UserByScreenName Query ID") },
                    placeholder = { Text("输入 Query ID（访问用户主页时从 Network 抓取）...") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = {
                        if (followingQueryId.isNotBlank()) {
                            userManagementViewModel.updateQueryId("following", followingQueryId)
                        }
                        if (userTweetsQueryId.isNotBlank()) {
                            userManagementViewModel.updateQueryId("user", userTweetsQueryId)
                        }
                        if (userByScreenNameQueryId.isNotBlank()) {
                            userManagementViewModel.updateQueryId("userByScreenName", userByScreenNameQueryId)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading && (followingQueryId.isNotBlank() ||
                            userTweetsQueryId.isNotBlank() ||
                            userByScreenNameQueryId.isNotBlank())
                ) {
                    Text(if (isLoading) "保存中..." else "💾 保存手动设置")
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 帮助文档
                HelpSection()
            }

            Spacer(modifier = Modifier.height(16.dp))
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
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Card(
            modifier = Modifier.fillMaxWidth()
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
private fun HelpSection() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Text(
                text = "💡 如何手动获取 Query ID?",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = androidx.compose.ui.text.font.FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            val steps = listOf(
                "打开 x.com 并登录",
                "按 F12 打开开发者工具 → Network 标签",
                "刷新页面，过滤 \"HomeLatestTimeline\"",
                "找到请求的 URL: graphql/QUERY_ID/HomeLatestTimeline",
                "复制 QUERY_ID (22位字符串)"
            )

            steps.forEachIndexed { index, step ->
                Text(
                    text = "${index + 1}. $step",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (index < steps.size - 1) {
                    Spacer(modifier = Modifier.height(4.dp))
                }
            }
        }
    }
}
