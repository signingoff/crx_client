# API 接口参考

## 认证接口

**文件**: `AuthApiService.kt`

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

## 推文接口

**文件**: `ApiService.kt`

### 推文列表

```kotlin
@GET("twitter/posts")
suspend fun getTwitterPosts(
    @Query("page") page: Int = 1,
    @Query("limit") limit: Int = 20
): Response<ApiResponse<List<Tweet>>>

@GET("xueqiu/posts")
suspend fun getXueqiuPosts(
    @Query("page") page: Int = 1,
    @Query("limit") limit: Int = 20
): Response<ApiResponse<List<Tweet>>>
```

### 用户管理

```kotlin
// Twitter 用户
@GET("twitter/users")
suspend fun getTwitterUsers(): Response<ApiResponse<List<MonitorUser>>>

@POST("twitter/users")
suspend fun addTwitterUser(@Body user: MonitorUser): Response<ApiResponse<Unit>>

@DELETE("twitter/users/{id}")
suspend fun deleteTwitterUser(@Path("id") id: String): Response<ApiResponse<Unit>>

// 雪球用户
@GET("xueqiu/users")
suspend fun getXueqiuUsers(): Response<ApiResponse<List<MonitorUser>>>

@POST("xueqiu/users")
suspend fun addXueqiuUser(@Body user: MonitorUser): Response<ApiResponse<Unit>>

@DELETE("xueqiu/users/{id}")
suspend fun deleteXueqiuUser(@Path("id") id: String): Response<ApiResponse<Unit>>
```

### 同步接口

```kotlin
@GET("xueqiu/sync")
suspend fun syncXueqiu(): Response<ApiResponse<Unit>>

@POST("twitter/users/sync")
suspend fun syncTwitterUsers(): Response<ApiResponse<Unit>>
```

### Query ID 配置

```kotlin
@GET("tweets/queryid-config")
suspend fun getQueryIdConfig(): Response<ApiResponse<QueryIdConfig>>

@POST("tweets/queryid-config")
suspend fun updateQueryIdConfig(
    @Body config: QueryIdUpdateRequest
): Response<ApiResponse<QueryIdConfig>>
```

## 数据模型

### Tweet

```kotlin
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

### Media

```kotlin
data class Media(
    val type: String,  // "photo", "video", "animated_gif"
    val url: String,
    val displayUrl: String? = null
)
```

### MonitorUser

```kotlin
data class MonitorUser(
    val userId: String,
    val screenName: String? = null,
    val name: String? = null
)
```

### QueryIdConfig

```kotlin
data class QueryIdConfig(
    val homeTimeline: String? = null,
    val homeLatestTimeline: String? = null,
    val userTweets: String? = null,
    val userByScreenName: String? = null
)
```

### ApiResponse

```kotlin
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null
)
```
