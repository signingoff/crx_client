# API 完整参考

## 推文 API

### fetchTwitterPosts

获取 Twitter 推文列表（支持分页）。

```javascript
const result = await fetchTwitterPosts({
  page: 1,      // 页码，从 1 开始
  limit: 20     // 每页数量，默认 20
})

// 返回值
{
  posts: Tweet[],
  hasMore: boolean
}
```

### fetchXueqiuPosts

获取雪球帖子列表。

```javascript
const result = await fetchXueqiuPosts({
  page: 1,
  limit: 20
})
```

## 认证 API

### 基路径规则

- 未配置 `VITE_API_BASE`: 使用当前站点相对路径 `/api/auth/*`
- 已配置 `VITE_API_BASE`: 使用 `${VITE_API_BASE}/auth/*`

### hasPassword

```javascript
const has = await hasPassword()  // GET {API_BASE}/has-password
```

### setPassword

```javascript
await setPassword('your-password')  // POST {API_BASE}/set-password
```

### login

```javascript
await login('your-password')  // POST {API_BASE}/login
```

### verifyToken

```javascript
const ok = await verifyToken()  // POST {API_BASE}/verify
```

## Query ID 配置 API

### getQueryConfig

获取当前 Query ID 配置。

```javascript
const config = await getQueryConfig()

// 返回值
{
  homeTimeline: 'MpnCeE0hy8m5eWobPx8euw',
  userTweets: '...',
  userByScreenName: '...'
}
```

### updateQueryId

更新指定类型的 Query ID。

```javascript
await updateQueryId('following', 'newQueryId')

// 类型：'home' | 'following' | 'userTweets' | 'userByScreenName'
```

## 用户管理 API

### fetchTwitterUsers

获取监控的 Twitter 用户列表。

```javascript
const users = await fetchTwitterUsers()
```

### addTwitterUser

添加监控用户。

```javascript
await addTwitterUser({
  user_id: '123456',
  screen_name: 'username'
})
```

### deleteTwitterUser

删除监控用户。

```javascript
await deleteTwitterUser('user_id')
```

### syncTwitterUsers

触发用户同步。

```javascript
await syncTwitterUsers()
```
