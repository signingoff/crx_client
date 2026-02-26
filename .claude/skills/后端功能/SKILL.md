---
name: 后端功能
description: X For You 后端功能说明 - Node.js + Express 技术栈
---

# 后端功能

## 技术栈
- Node.js
- Express
- Axios
- X.com GraphQL API

## 核心功能

### 1. X API 数据获取
**文件**: `backend/src/services/xService.js`

- 调用 X GraphQL API: `HomeTimeline`
- 需配置 Cookie: `auth_token`, `ct0`
- 解析嵌套响应结构
- Query ID: `MpnCeE0hy8m5eWobPx8euw`（需定期更新）

### 2. 内容过滤

#### 日语推文过滤
**文件**: `backend/src/services/xService.js` 第 90-95 行

```javascript
function isJapaneseText(text) {
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  return japaneseRegex.test(text);
}
```

- 检测平假名（\u3040-\u309F）
- 检测片假名（\u30A0-\u30FF）
- 自动过滤包含日文字符的推文

#### 黑名单过滤
**文件**:
- `backend/src/config/blacklist.js` - 黑名单管理模块
- `backend/src/config/blacklist.json` - 黑名单数据（持久化存储）

**匹配方式**:
- 用户ID (`userId`) - 精确匹配
- 用户名 (`username`) - 不区分大小写匹配

**过滤时机**: 获取推文列表时自动过滤，黑名单用户推文不会返回给前端

**默认黑名单**:
```json
{
  "users": ["44196397"],
  "usernames": ["elonmusk"]
}
```

### 3. 黑名单管理 API
**文件**: `backend/src/routes/tweets.js`

| 方法 | 端点 | 功能 | 请求体 |
|------|------|------|--------|
| GET | `/api/tweets/blacklist` | 获取黑名单 | - |
| POST | `/api/tweets/blacklist` | 添加用户 | `{userId?, username?}` |
| DELETE | `/api/tweets/blacklist` | 移除用户 | `{userId?, username?}` |

**使用示例**:
```bash
# 添加用户到黑名单
curl -X POST http://localhost:3000/api/tweets/blacklist \
  -H "Content-Type: application/json" \
  -d '{"username": "someuser"}'

# 按用户ID添加
curl -X POST http://localhost:3000/api/tweets/blacklist \
  -H "Content-Type: application/json" \
  -d '{"userId": "123456789"}'

# 查看黑名单
curl http://localhost:3000/api/tweets/blacklist

# 从黑名单移除
curl -X DELETE http://localhost:3000/api/tweets/blacklist \
  -H "Content-Type: application/json" \
  -d '{"username": "someuser"}'
```

### 4. CORS 配置
**文件**: `backend/src/index.js`

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];
```

### 5. 数据结构解析
**文件**: `backend/src/services/xService.js`

#### 长推文处理
长推文（超过 280 字符）的完整文本在 `note_tweet` 字段中：

```javascript
// 获取长推文完整文本（尝试多个可能的路径）
const noteTweetText = tweetData.note_tweet?.note_tweet_results?.result?.text
  || tweetData.result?.note_tweet?.note_tweet_results?.result?.text
  || tweet.note_tweet?.note_tweet_results?.result?.text;

// 获取完整文本
const fullText = noteTweetText || tweet.full_text || tweet.text || '';

// 判断是否为长推文：有 noteTweetText 或者文本超过 280 字符
const isLongText = !!noteTweetText || fullText.length > 280;

return {
  text: fullText,
  isLongText,  // 标记是否为长推文，供前端显示 "Show more" 按钮
  // ...
}
```

#### 用户数据路径（已更新）:
```javascript
// 用户信息
tweetData.core?.user_results?.result?.core

// 头像 URL
tweetData.core?.user_results?.result?.avatar?.image_url
```

媒体数据:
```javascript
{
  type: 'photo' | 'video' | 'animated_gif',
  url: '图片URL',
  displayUrl: '显示URL',
  video_info: { /* 视频变体信息 */ }
}
```

## API 端点

| 端点 | 描述 |
|------|------|
| `GET /api/tweets/for-you?count=20&t=12345` | 获取 For You 推文（t防缓存） |
| `GET /api/tweets/health` | 健康检查 |
| `GET /api/tweets/blacklist` | 获取黑名单列表 |
| `POST /api/tweets/blacklist` | 添加用户到黑名单（支持 username 或 userId） |
| `DELETE /api/tweets/blacklist` | 从黑名单移除用户 |

### 前端拉黑流程
1. 用户点击推文卡片右上角 "⋯" 菜单
2. 选择"拉黑 @username"
3. 前端调用 `POST /api/tweets/blacklist`
4. 后端将用户加入 `blacklist.json`
5. 前端从当前列表过滤该用户所有推文
6. 后续请求自动过滤黑名单用户推文

## 配置文件

### 环境变量
**文件**: `backend/.env`

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173

# X.com Cookies
X_AUTH_TOKEN=your_auth_token
X_CT0=your_ct0_token
```

### 黑名单配置
**文件**: `backend/src/config/blacklist.json`

```json
{
  "users": ["用户ID1", "用户ID2"],
  "usernames": ["用户名1", "用户名2"]
}
```

## 目录结构
```
backend/src/
├── config/
│   ├── auth.js           # Cookie 配置
│   ├── blacklist.js      # 黑名单管理模块
│   └── blacklist.json    # 黑名单数据文件
├── routes/
│   └── tweets.js         # API 路由
├── services/
│   └── xService.js       # X API 调用服务
└── index.js              # 入口文件
```

## 注意事项

1. **Cookie 有效期**: X.com 的 cookie 会过期，需定期更新
2. **Query ID**: GraphQL Query ID 可能变化，需从浏览器抓取新的 ID
3. **速率限制**: 过于频繁请求可能导致账号受限
