# 原生 Android App 设计方案

## 概述
使用 Kotlin + Jetpack Compose 开发原生 Android App，替代现有的 WebView 包装方案，提供更好的用户体验和原生性能。

## 设计目标
- 解决 WebView 显示不完全的问题
- 提供原生流畅的滚动和交互体验
- 纯远程 API 调用，不本地存储
- 支持 Android 8.0+ (API 26+)

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Kotlin | 1.9+ | 编程语言 |
| Jetpack Compose | 2024.02+ | UI 框架 |
| Retrofit | 2.9+ | HTTP 客户端 |
| Coil | 2.5+ | 图片加载 |
| Navigation Compose | 2.7+ | 页面导航 |
| ViewModel | 2.7+ | 状态管理 |

## 架构

采用 MVVM + Repository 模式：

```
UI Layer (Composable)
    ↓
ViewModel (State Holder)
    ↓
Repository (Data Logic)
    ↓
API Service (Retrofit)
    ↓
Backend API
```

## 功能范围

### 包含功能
- 首页推文/帖子混合列表
- 下拉刷新
- 加载更多（分页）
- 推文卡片显示（作者、内容、时间、已读状态）
- 媒体图片显示（网格布局）
- 三连击标记已读/未读
- 设置页（后端 API 地址配置）

### 不包含功能
- 用户管理（添加/删除监控用户）
- Query ID 配置
- 离线缓存
- 推送通知
- 图片 Lightbox/全屏查看
- 视频播放

## 数据模型

```kotlin
data class Tweet(
    val id: String,
    val text: String,
    val createdAt: String,
    val author: Author,
    val isRead: Boolean,
    val source: String, // "twitter" or "xueqiu"
    val media: List<Media>,
    val metrics: Metrics?
)

data class Author(
    val id: String,
    val name: String,
    val username: String,
    val avatar: String,
    val description: String?,
    val followersCount: Int?,
    val followingCount: Int?
)

data class Media(
    val type: String, // "photo", "video", "animated_gif"
    val url: String,
    val previewUrl: String?
)

data class Metrics(
    val replies: Int?,
    val retweets: Int?,
    val likes: Int?
)
```

## API 接口

```kotlin
interface ApiService {
    @GET("twitter/posts")
    suspend fun getTwitterPosts(): Response<List<Tweet>>

    @GET("xueqiu/posts")
    suspend fun getXueqiuPosts(): Response<List<XueqiuPost>>

    @POST("twitter/posts/{id}/read")
    suspend fun markTwitterRead(
        @Path("id") id: String,
        @Body body: MarkReadRequest
    ): Response<Unit>

    @POST("xueqiu/posts/{id}/read")
    suspend fun markXueqiuRead(
        @Path("id") id: String,
        @Body body: MarkReadRequest
    ): Response<Unit>
}

data class MarkReadRequest(val isRead: Boolean)
```

## 项目结构

```
app/src/main/java/com/xueqiu/xforyou/
├── data/
│   ├── api/
│   │   └── ApiService.kt
│   ├── model/
│   │   ├── Tweet.kt
│   │   ├── Author.kt
│   │   └── XueqiuPost.kt
│   └── repository/
│       └── TweetRepository.kt
├── di/
│   └── NetworkModule.kt
├── ui/
│   ├── home/
│   │   ├── HomeScreen.kt
│   │   └── HomeViewModel.kt
│   ├── components/
│   │   ├── TweetCard.kt
│   │   ├── TweetList.kt
│   │   └── AuthorInfo.kt
│   ├── settings/
│   │   └── SettingsScreen.kt
│   └── theme/
│       ├── Color.kt
│       ├── Theme.kt
│       └── Type.kt
└── MainActivity.kt
```

## UI 设计

### 首页
- 顶部标题栏 "X For You"
- 下拉刷新指示器
- 推文列表（垂直滚动）
- 底部加载更多指示器

### 推文卡片
- 顶部：头像 + 作者名 + 用户名 + 时间
- 中部：推文内容（支持展开/收起）
- 底部：媒体图片网格（最多 4 张）
- 已读标记：右上角小圆点

### 交互
- 单击：标记已读
- 长按：复制内容
- 下拉：刷新列表
- 上滑：加载更多

## 主题

```kotlin
// 颜色
val Primary = Color(0xFF1D9BF0)  // Twitter Blue
val Background = Color(0xFF000000)  // 黑色背景
val Surface = Color(0xFF16181C)  // 卡片背景
val TextPrimary = Color(0xFFE7E9EA)  // 主文字
val TextSecondary = Color(0xFF71767B)  // 次要文字
```

## 后端地址配置

使用 SharedPreferences 存储：
- 默认地址：`https://x-for-you-backend.onrender.com/api`
- 可在设置页修改

## 依赖注入

使用 Hilt 进行依赖注入：
- ApiService 单例
- Repository 单例
- ViewModel 注入

## 权限

仅需 INTERNET 权限。

## 构建输出

- Debug APK: `app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `app/build/outputs/apk/release/app-release.apk`

## 注意事项

1. 后端 API 地址可配置，默认使用 Render 部署地址
2. 所有数据从后端实时获取，无本地缓存
3. 图片使用 Coil 加载，支持缓存
4. 错误处理：网络错误显示 Snackbar 提示
