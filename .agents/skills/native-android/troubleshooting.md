# 常见问题排查

## 构建问题

### Gradle 同步失败

**现象**: `Could not resolve dependency`

**解决**:
1. 检查网络连接
2. 尝试更换 Maven 源
3. 清理并重新构建：
```bash
./gradlew clean
./gradlew build
```

### 编译错误

**现象**: `Unresolved reference`

**排查**:
1. 检查依赖是否正确添加
2. 检查 import 语句
3. 检查 Kotlin 版本兼容性

---

## 运行时问题

### 无法连接后端

**现象**: `java.net.UnknownHostException` 或连接超时

**排查**:
1. 检查后端地址配置（设置页面）
2. 确认网络权限已添加：
```xml
<uses-permission android:name="android.permission.INTERNET" />
```
3. 检查后端服务是否运行
4. 确认使用 HTTPS（Android 9+ 默认禁止明文 HTTP）

### 图片无法加载

**现象**: 图片区域空白

**排查**:
1. 检查 Coil 依赖是否正确添加
2. 检查网络权限
3. 查看图片 URL 是否可访问

---

## 认证问题

### 登录失败

**现象**: 401 Unauthorized

**排查**:
1. 确认后端地址正确
2. 检查密码是否正确
3. 查看后端日志

### Token 失效

**现象**: 访问受保护页面时跳转到登录

**解决**:
1. 重新登录
2. 检查 Token 是否过期
3. 查看 Auth Interceptor 是否正确附加 Header

---

## 调试技巧

### 查看网络请求

```kotlin
// 添加日志拦截器
val client = OkHttpClient.Builder()
    .addInterceptor(HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    })
    .build()
```

### 查看数据库

使用 Android Studio 的 Database Inspector：
1. 运行应用
2. View → Tool Windows → Database Inspector
3. 查看 SharedPreferences 内容

---

## 性能优化

### 列表卡顿

**优化建议**:
1. 使用 `LazyColumn` 代替 `Column`
2. 添加 `key` 参数：
```kotlin
LazyColumn {
    items(tweets, key = { it.id }) { tweet ->
        TweetCard(tweet = tweet)
    }
}
```
3. 使用 `remember` 缓存计算结果

### 图片加载慢

**优化**:
1. 使用 Coil 的缓存功能
2. 使用缩略图 URL
3. 预加载图片
