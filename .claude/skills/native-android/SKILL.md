---
name: native-android
description: X For You 原生 Android App 开发文档 - Kotlin + Jetpack Compose
---

# 原生 Android 功能

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Kotlin | 1.9.22 | 编程语言 |
| Jetpack Compose | 2024.02+ | UI 框架 |
| Retrofit | 2.9.0 | HTTP 客户端 |
| Coil | 2.5.0 | 图片加载 |
| Navigation Compose | 2.7.7 | 页面导航 |
| ViewModel | 2.7.0 | 状态管理 |
| Hilt | 2.50 | 依赖注入 |

## 项目结构

```
android-native/
├── app/src/main/java/com/xueqiu/xforyou/
│   ├── data/
│   │   ├── api/
│   │   │   ├── ApiService.kt          # 推文 API 接口
│   │   │   └── AuthApiService.kt      # 认证 API 接口
│   │   ├── local/
│   │   │   ├── AuthDataStore.kt       # Token 存储
│   │   │   └── SettingsDataStore.kt   # SharedPreferences 封装
│   │   ├── model/
│   │   │   ├── Tweet.kt               # 推文数据模型
│   │   │   ├── Author.kt              # 作者数据模型
│   │   │   ├── Media.kt               # 媒体数据模型
│   │   │   └── ApiResponse.kt         # API 响应包装类
│   │   └── repository/
│   │       ├── AuthRepository.kt      # 认证仓库
│   │       └── TweetRepository.kt     # 推文仓库
│   ├── di/
│   │   └── NetworkModule.kt           # Hilt 依赖注入模块
│   ├── ui/
│   │   ├── auth/
│   │   │   ├── LoginScreen.kt         # 登录/设置密码页
│   │   │   └── LoginViewModel.kt      # 登录 ViewModel
│   │   ├── components/
│   │   │   ├── TweetCard.kt           # 推文卡片组件
│   │   │   └── ImageLightbox.kt       # 图片放大查看组件
│   │   ├── home/
│   │   │   ├── HomeScreen.kt          # 首页
│   │   │   └── HomeViewModel.kt       # 首页 ViewModel
│   │   ├── navigation/
│   │   │   ├── AppNavigation.kt       # 导航配置
│   │   │   └── Screen.kt              # 路由定义
│   │   ├── settings/
│   │   │   ├── SettingsScreen.kt      # 设置页面
│   │   │   └── SettingsViewModel.kt   # 设置 ViewModel
│   │   └── theme/
│   │       ├── Color.kt               # 颜色定义
│   │       ├── Theme.kt               # 主题配置
│   │       └── Type.kt                # 字体配置
│   ├── MainActivity.kt                # 主 Activity
│   └── XForYouApplication.kt          # Application 类
├── build.gradle.kts                   # 项目级构建配置
└── app/build.gradle.kts               # 模块级构建配置
```

## 核心功能

### 1. 自动刷新

**文件**: `HomeViewModel.kt`

- 每 8 秒自动刷新推文列表
- 使用 `viewModelScope.launch` + `delay(8000)` 实现定时器
- 页面关闭时自动取消（`onCleared()` 中 `refreshJob?.cancel()`）

### 2. 三连击标记已读

**文件**: `TweetCard.kt`

- 500ms 内点击 3 次触发已读/未读切换
- 使用 `mutableIntStateOf` 记录点击次数
- 使用 `mutableLongStateOf` 记录上次点击时间
- 超过时间窗口重置点击计数

### 3. 图片 Lightbox

**文件**: `ImageLightbox.kt`

- 全屏 Dialog 显示图片
- 支持双指缩放（`detectTransformGestures`）
- 点击背景或关闭按钮退出

### 4. 后端地址配置

**文件**: `SettingsDataStore.kt`, `SettingsScreen.kt`

- 使用 SharedPreferences 存储
- 默认地址: `https://x-for-you-backend.onrender.com/api/`
- 修改后需重启应用生效

### 5. 用户认证

**文件**: `AuthDataStore.kt`, `AuthRepository.kt`, `LoginScreen.kt`, `LoginViewModel.kt`

- Token 存储在 SharedPreferences
- 启动时检查 token 有效性
- 首次使用显示设置密码界面

**API 接口**:
```kotlin
interface AuthApiService {
    @GET("auth/has-password")
    suspend fun hasPassword(): Response<ApiResponse<HasPasswordResponse>>

    @POST("auth/set-password")
    suspend fun setPassword(@Body body: PasswordRequest): Response<ApiResponse<LoginResponse>>

    @POST("auth/login")
    suspend fun login(@Body body: PasswordRequest): Response<ApiResponse<LoginResponse>>

    @POST("auth/verify")
    suspend fun verifyToken(@Body body: TokenRequest): Response<ApiResponse<Boolean>>
}
```

**Auth Interceptor**: 自动为请求附加 `Authorization: Bearer {token}` Header

## 数据模型

### Tweet
```kotlin
data class Tweet(
    val id: String,
    val text: String,
    val createdAt: String,
    val author: Author,
    val isRead: Boolean = false,
    val source: String = "twitter",  // "twitter" or "xueqiu"
    val media: List<Media> = emptyList(),
    val metrics: Metrics? = null
)
```

### Author
```kotlin
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

## API 接口

```kotlin
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

## 主题配色

```kotlin
val TwitterBlue = Color(0xFF1D9BF0)
val Black = Color(0xFF000000)
val DarkGray = Color(0xFF16181C)      // 卡片背景
val TextPrimary = Color(0xFFE7E9EA)   // 主文字
val TextSecondary = Color(0xFF71767B) // 次要文字
val Success = Color(0xFF00B075)       // 已读标记
```

## 构建 APK

```bash
cd android-native
./gradlew assembleDebug
```

APK 输出位置: `app/build/outputs/apk/debug/app-debug.apk`

## 注意事项

1. **minSdk**: 26 (Android 8.0)
2. **targetSdk**: 34
3. **编译 SDK**: 34
4. **Java 版本**: 17

## 依赖注入

使用 Hilt 进行依赖注入：
- `XForYouApplication` 添加 `@HiltAndroidApp`
- `MainActivity` 添加 `@AndroidEntryPoint`
- `ViewModel` 添加 `@HiltViewModel`，构造函数添加 `@Inject`
