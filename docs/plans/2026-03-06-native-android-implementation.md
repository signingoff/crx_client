# 原生 Android App 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 使用 Kotlin + Jetpack Compose 开发 X For You 原生 Android 客户端

**架构:** MVVM + Repository 模式，Retrofit 调用后端 API，Jetpack Compose 构建 UI，纯远程数据无本地存储

**Tech Stack:** Kotlin 1.9, Jetpack Compose, Retrofit 2.9, Coil 2.5, Hilt, Navigation Compose

---

## 前置要求

- Android Studio Hedgehog (2023.1.1) 或更新版本
- JDK 17+
- Android SDK API 26+

---

## 任务列表

### Task 1: 创建 Android 项目

**目标:** 在 Android Studio 中创建新项目

**Files:**
- Create: `android-native/` 目录

**Step 1: 创建项目**

在 Android Studio 中：
1. File → New → New Project
2. 选择 "Empty Activity"
3. 配置：
   - Name: XForYou
   - Package: com.xueqiu.xforyou
   - Language: Kotlin
   - Minimum SDK: API 26
   - Build config: Kotlin DSL

**Step 2: 验证项目结构**

Run: `ls android-native/app/src/main/java/com/xueqiu/xforyou/`
Expected: 包含 MainActivity.kt

**Step 3: 首次提交**

```bash
cd android-native
git init
git add .
git commit -m "chore: initial Android project"
```

---

### Task 2: 添加依赖

**目标:** 配置 build.gradle.kts 添加所需依赖

**Files:**
- Modify: `android-native/app/build.gradle.kts`
- Modify: `android-native/build.gradle.kts`

**Step 1: 修改项目级 build.gradle.kts**

```kotlin
plugins {
    id("com.android.application") version "8.2.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
    id("com.google.dagger.hilt.android") version "2.50" apply false
}
```

**Step 2: 修改模块级 build.gradle.kts**

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.xueqiu.xforyou"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.xueqiu.xforyou"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Compose
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")

    // Retrofit
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Coil (图片加载)
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Hilt (依赖注入)
    implementation("com.google.dagger:hilt-android:2.50")
    kapt("com.google.dagger:hilt-compiler:2.50")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Debug
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

**Step 3: 同步 Gradle**

Run: 点击 Android Studio 中的 "Sync Now"
Expected: 同步成功，无错误

**Step 4: 提交**

```bash
git add .
git commit -m "chore: add dependencies"
```

---

### Task 3: 创建数据模型

**目标:** 创建 Tweet, Author, Media 数据类

**Files:**
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/data/model/Tweet.kt`
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/data/model/Author.kt`
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/data/model/Media.kt`

**Step 1: 创建 Tweet.kt**

```kotlin
package com.xueqiu.xforyou.data.model

data class Tweet(
    val id: String,
    val text: String,
    val createdAt: String,
    val author: Author,
    val isRead: Boolean = false,
    val source: String = "twitter",
    val media: List<Media> = emptyList(),
    val metrics: Metrics? = null
)

data class Metrics(
    val replies: Int? = null,
    val retweets: Int? = null,
    val likes: Int? = null
)
```

**Step 2: 创建 Author.kt**

```kotlin
package com.xueqiu.xforyou.data.model

data class Author(
    val id: String,
    val name: String,
    val username: String,
    val avatar: String,
    val description: String? = null,
    val followersCount: Int? = null,
    val followingCount: Int? = null
)
```

**Step 3: 创建 Media.kt**

```kotlin
package com.xueqiu.xforyou.data.model

data class Media(
    val type: String, // "photo", "video", "animated_gif"
    val url: String,
    val previewUrl: String? = null
)
```

**Step 4: 创建 API 响应包装类**

```kotlin
package com.xueqiu.xforyou.data.model

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null
)

data class MarkReadRequest(
    val isRead: Boolean
)
```

**Step 5: 提交**

```bash
git add .
git commit -m "feat: add data models"
```

---

### Task 4: 创建 API 接口

**目标:** 创建 Retrofit API Service

**Files:**
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/data/api/ApiService.kt`

**Step 1: 创建 ApiService.kt**

```kotlin
package com.xueqiu.xforyou.data.api

import com.xueqiu.xforyou.data.model.ApiResponse
import com.xueqiu.xforyou.data.model.MarkReadRequest
import com.xueqiu.xforyou.data.model.Tweet
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {
    @GET("twitter/posts")
    suspend fun getTwitterPosts(): Response<ApiResponse<List<Tweet>>>

    @GET("xueqiu/posts")
    suspend fun getXueqiuPosts(): Response<ApiResponse<List<Tweet>>>

    @POST("twitter/posts/{id}/read")
    suspend fun markTwitterRead(
        @Path("id") id: String,
        @Body body: MarkReadRequest
    ): Response<ApiResponse<Unit>>

    @POST("xueqiu/posts/{id}/read")
    suspend fun markXueqiuRead(
        @Path("id") id: String,
        @Body body: MarkReadRequest
    ): Response<ApiResponse<Unit>>
}
```

**Step 2: 提交**

```bash
git add .
git commit -m "feat: add API service interface"
```

---

### Task 5: 配置 Hilt 依赖注入

**目标:** 设置 Hilt 和 Network Module

**Files:**
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/XForYouApplication.kt`
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/di/NetworkModule.kt`
- Modify: `android-native/app/src/main/AndroidManifest.xml`

**Step 1: 创建 Application 类**

```kotlin
package com.xueqiu.xforyou

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class XForYouApplication : Application()
```

**Step 2: 创建 NetworkModule**

```kotlin
package com.xueqiu.xforyou.di

import com.xueqiu.xforyou.data.api.ApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    private const val BASE_URL = "https://x-for-you-backend.onrender.com/api/"

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            .addInterceptor(logging)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}
```

**Step 3: 修改 AndroidManifest.xml**

```xml
<application
    android:name=".XForYouApplication"
    ... >
```

**Step 4: 提交**

```bash
git add .
git commit -m "feat: setup Hilt and NetworkModule"
```

---

### Task 6: 创建 Repository

**目标:** 创建数据仓库层

**Files:**
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/data/repository/TweetRepository.kt`

**Step 1: 创建 TweetRepository.kt**

```kotlin
package com.xueqiu.xforyou.data.repository

import com.xueqiu.xforyou.data.api.ApiService
import com.xueqiu.xforyou.data.model.MarkReadRequest
import com.xueqiu.xforyou.data.model.Tweet
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TweetRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getTwitterPosts(): Result<List<Tweet>> {
        return try {
            val response = apiService.getTwitterPosts()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true) {
                    Result.success(body.data ?: emptyList())
                } else {
                    Result.failure(Exception(body?.error ?: "Unknown error"))
                }
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Network error"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getXueqiuPosts(): Result<List<Tweet>> {
        return try {
            val response = apiService.getXueqiuPosts()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true) {
                    Result.success(body.data ?: emptyList())
                } else {
                    Result.failure(Exception(body?.error ?: "Unknown error"))
                }
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Network error"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markTwitterRead(id: String, isRead: Boolean): Result<Unit> {
        return try {
            val response = apiService.markTwitterRead(id, MarkReadRequest(isRead))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to mark read"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markXueqiuRead(id: String, isRead: Boolean): Result<Unit> {
        return try {
            val response = apiService.markXueqiuRead(id, MarkReadRequest(isRead))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to mark read"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

**Step 2: 提交**

```bash
git add .
git commit -m "feat: add TweetRepository"
```

---

### Task 7: 创建 ViewModel

**目标:** 创建 HomeViewModel

**Files:**
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/ui/home/HomeViewModel.kt`

**Step 1: 创建 HomeViewModel.kt**

```kotlin
package com.xueqiu.xforyou.ui.home

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.xueqiu.xforyou.data.model.Tweet
import com.xueqiu.xforyou.data.repository.TweetRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: TweetRepository
) : ViewModel() {

    private val _tweets = mutableStateOf<List<Tweet>>(emptyList())
    val tweets: State<List<Tweet>> = _tweets

    private val _isLoading = mutableStateOf(false)
    val isLoading: State<Boolean> = _isLoading

    private val _error = mutableStateOf<String?>(null)
    val error: State<String?> = _error

    init {
        loadTweets()
    }

    fun loadTweets() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            val twitterResult = repository.getTwitterPosts()
            val xueqiuResult = repository.getXueqiuPosts()

            val allTweets = mutableListOf<Tweet>()

            twitterResult.onSuccess { allTweets.addAll(it) }
            xueqiuResult.onSuccess { allTweets.addAll(it) }

            // 按时间排序
            _tweets.value = allTweets.sortedByDescending { it.createdAt }

            if (twitterResult.isFailure && xueqiuResult.isFailure) {
                _error.value = "Failed to load tweets"
            }

            _isLoading.value = false
        }
    }

    fun markTweetRead(tweet: Tweet) {
        if (tweet.isRead) return

        viewModelScope.launch {
            val result = if (tweet.source == "twitter") {
                repository.markTwitterRead(tweet.id, true)
            } else {
                repository.markXueqiuRead(tweet.id, true)
            }

            result.onSuccess {
                // 更新本地状态
                _tweets.value = _tweets.value.map {
                    if (it.id == tweet.id) it.copy(isRead = true) else it
                }
            }
        }
    }

    fun refresh() {
        loadTweets()
    }

    fun clearError() {
        _error.value = null
    }
}
```

**Step 2: 提交**

```bash
git add .
git commit -m "feat: add HomeViewModel"
```

---

### Task 8: 创建主题

**目标:** 配置 Compose 主题

**Files:**
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/ui/theme/Color.kt`
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/ui/theme/Theme.kt`
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/ui/theme/Type.kt`

**Step 1: 创建 Color.kt**

```kotlin
package com.xueqiu.xforyou.ui.theme

import androidx.compose.ui.graphics.Color

val TwitterBlue = Color(0xFF1D9BF0)
val Black = Color(0xFF000000)
val DarkGray = Color(0xFF16181C)
val LightGray = Color(0xFF1E2730)
val TextPrimary = Color(0xFFE7E9EA)
val TextSecondary = Color(0xFF71767B)
val White = Color(0xFFFFFFFF)
val Success = Color(0xFF00B075)
```

**Step 2: 创建 Type.kt**

```kotlin
package com.xueqiu.xforyou.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp
    )
)
```

**Step 3: 创建 Theme.kt**

```kotlin
package com.xueqiu.xforyou.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = TwitterBlue,
    secondary = TextSecondary,
    tertiary = LightGray,
    background = Black,
    surface = DarkGray,
    onPrimary = White,
    onSecondary = TextPrimary,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

@Composable
fun XForYouTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
```

**Step 4: 提交**

```bash
git add .
git commit -m "feat: add Compose theme"
```

---

### Task 9: 创建 UI 组件

**目标:** 创建 TweetCard 组件

**Files:**
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/ui/components/TweetCard.kt`

**Step 1: 创建 TweetCard.kt**

```kotlin
package com.xueqiu.xforyou.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.xueqiu.xforyou.data.model.Tweet
import com.xueqiu.xforyou.ui.theme.Success
import com.xueqiu.xforyou.ui.theme.TextSecondary
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun TweetCard(
    tweet: Tweet,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // 作者信息行
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 头像
                AsyncImage(
                    model = tweet.author.avatar,
                    contentDescription = "Avatar",
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )

                Spacer(modifier = Modifier.width(12.dp))

                // 作者名和用户名
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = tweet.author.name,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "@${tweet.author.username}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }

                // 时间和已读标记
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = formatTime(tweet.createdAt),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                    if (tweet.isRead) {
                        Text(
                            text = "✓",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Success
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 推文内容
            Text(
                text = tweet.text,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 5,
                overflow = TextOverflow.Ellipsis
            )

            // 媒体图片
            if (tweet.media.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                MediaGrid(media = tweet.media)
            }
        }
    }
}

@Composable
private fun MediaGrid(media: List<com.xueqiu.xforyou.data.model.Media>) {
    val displayMedia = media.take(4)
    val columns = if (displayMedia.size == 1) 1 else 2

    Column(
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        displayMedia.chunked(columns).forEach { rowMedia ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                rowMedia.forEach { m ->
                    AsyncImage(
                        model = m.url,
                        contentDescription = "Media",
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(1f)
                            .clip(RoundedCornerShape(8.dp)),
                        contentScale = ContentScale.Crop
                    )
                }
            }
        }
    }
}

private fun formatTime(isoTime: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        inputFormat.timeZone = TimeZone.getTimeZone("UTC")
        val date = inputFormat.parse(isoTime)

        val outputFormat = SimpleDateFormat("MM-dd HH:mm", Locale.getDefault())
        outputFormat.format(date!!)
    } catch (e: Exception) {
        isoTime
    }
}
```

**Step 2: 提交**

```bash
git add .
git commit -m "feat: add TweetCard component"
```

---

### Task 10: 创建首页

**目标:** 创建 HomeScreen

**Files:**
- Create: `android-native/app/src/main/java/com/xueqiu/xforyou/ui/home/HomeScreen.kt`

**Step 1: 创建 HomeScreen.kt**

```kotlin
package com.xueqiu.xforyou.ui.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.xueqiu.xforyou.ui.components.TweetCard

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel()
) {
    val tweets by viewModel.tweets
    val isLoading by viewModel.isLoading
    val error by viewModel.error

    val pullRefreshState = rememberPullRefreshState(
        refreshing = isLoading,
        onRefresh = { viewModel.refresh() }
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("🔥 X For You") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        snackbarHost = { SnackbarHost(hostState = remember { SnackbarHostState() }) }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .pullRefresh(pullRefreshState)
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize()
            ) {
                items(tweets, key = { it.id }) { tweet ->
                    TweetCard(
                        tweet = tweet,
                        onClick = { viewModel.markTweetRead(tweet) }
                    )
                }
            }

            PullRefreshIndicator(
                refreshing = isLoading,
                state = pullRefreshState,
                modifier = Modifier.align(Alignment.TopCenter)
            )
        }

        // 错误提示
        error?.let { errorMsg ->
            Snackbar(
                modifier = Modifier.padding(16.dp),
                action = {
                    TextButton(onClick = { viewModel.clearError() }) {
                        Text("Dismiss")
                    }
                }
            ) {
                Text(errorMsg)
            }
        }
    }
}
```

**Step 2: 提交**

```bash
git add .
git commit -m "feat: add HomeScreen"
```

---

### Task 11: 更新 MainActivity

**目标:** 配置导航和主题

**Files:**
- Modify: `android-native/app/src/main/java/com/xueqiu/xforyou/MainActivity.kt`

**Step 1: 修改 MainActivity.kt**

```kotlin
package com.xueqiu.xforyou

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.xueqiu.xforyou.ui.home.HomeScreen
import com.xueqiu.xforyou.ui.theme.XForYouTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            XForYouTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    HomeScreen()
                }
            }
        }
    }
}
```

**Step 2: 添加网络权限**

修改 `android-native/app/src/main/AndroidManifest.xml`：

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

**Step 3: 提交**

```bash
git add .
git commit -m "feat: update MainActivity and add internet permission"
```

---

### Task 12: 构建 APK

**目标:** 构建 Debug APK

**Step 1: 构建 APK**

在 Android Studio 中：
Build → Build Bundle(s) / APK(s) → Build APK(s)

或命令行：
```bash
cd android-native
./gradlew assembleDebug
```

**Step 2: 验证 APK**

Run: `ls -lh app/build/outputs/apk/debug/`
Expected: app-debug.apk (约 20-30MB)

**Step 3: 提交**

```bash
git add .
git commit -m "chore: ready for first build"
```

---

## 后续优化建议

1. 添加分页加载（LazyList 底部加载更多）
2. 添加图片点击放大
3. 添加设置页修改后端地址
4. 添加错误重试机制
5. 优化时间格式化（显示"几分钟前"）
