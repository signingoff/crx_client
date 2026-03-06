# API 路由详细参考

## Twitter 路由

**文件**: `backend/src/routes/twitter.js`

### GET /api/twitter/posts
获取推文列表（支持分页）。

**Query 参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20 |

**响应**:
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "hasMore": true
  }
}
```

### GET /api/twitter/users
获取监控用户列表。

**响应**:
```json
{
  "success": true,
  "data": [...]
}
```

### POST /api/twitter/users
添加监控用户。

**Body**:
```json
{
  "user_id": "123456",
  "screen_name": "username"
}
```

### DELETE /api/twitter/users/:userId
删除监控用户。

### GET /api/twitter/sync
手动触发同步。

**响应**:
```json
{
  "success": true,
  "message": "Sync started"
}
```

---

## 雪球路由

**文件**: `backend/src/routes/xueqiu.js`

### GET /api/xueqiu/posts
获取雪球帖子列表。

**Query 参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20 |

### GET /api/xueqiu/users
获取雪球监控用户列表。

### POST /api/xueqiu/users
添加雪球监控用户。

**Body**:
```json
{
  "user_id": "123456"
}
```

### DELETE /api/xueqiu/users/:userId
删除雪球监控用户。

### GET /api/xueqiu/sync
手动触发雪球同步。

---

## Query ID 配置路由

**文件**: `backend/src/routes/twitterQueryConfig.js`

### GET /api/tweets/queryid-config
获取当前 Query ID 配置。

**响应**:
```json
{
  "success": true,
  "data": {
    "homeTimeline": "MpnCeE0hy8m5eWobPx8euw",
    "homeLatestTimeline": "...",
    "userTweets": "...",
    "userByScreenName": "..."
  }
}
```

### POST /api/tweets/queryid-config
更新 Query ID 配置。

**Body**:
```json
{
  "type": "userTweets",
  "queryId": "newQueryId"
}
```

**type 可选值**:
- `homeTimeline` - HomeTimeline
- `homeLatestTimeline` - HomeLatestTimeline (Following)
- `userTweets` - UserTweets
- `userByScreenName` - UserByScreenName

---
