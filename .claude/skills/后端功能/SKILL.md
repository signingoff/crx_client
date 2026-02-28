---
name: 后端功能
description: X For You 后端功能说明 - Node.js + Express + SQLite 技术栈
---

# 后端功能

## 技术栈
- Node.js (v18+)
- Express 4.x
- Axios (HTTP 请求)
- better-sqlite3 (SQLite 数据库)
- X.com GraphQL API

## 目录结构

```
backend/
├── src/
│   ├── config/
│   │   ├── auth.js           # Cookie 配置
│   │   └── queryConfig.js    # Query ID 配置
│   ├── db/
│   │   └── sqlite.js         # SQLite 数据库模块
│   ├── routes/
│   │   └── tweets.js         # API 路由
│   ├── services/
│   │   └── xService.js       # X API 调用服务
│   ├── index.js              # 入口文件
├── data/
│   └── posts.db              # SQLite 数据库文件
├── .env                      # 环境变量
└── package.json
```

## 环境配置

### .env 文件
```env
PORT=3000
CORS_ORIGIN=http://localhost:5173

# X.com Cookies（必需）
X_AUTH_TOKEN=your_auth_token_here
X_CT0=your_csrf_token_here

# X API Bearer Token（必需）
X_BEARER_TOKEN=your_bearer_token_here
```

### Cookie 和 Token 获取方法
1. 登录 x.com
2. 打开浏览器开发者工具 (F12)
3. 切换到 Application/Storage → Cookies
4. 复制以下值：
   - `auth_token` → `X_AUTH_TOKEN`
   - `ct0` → `X_CT0`
5. 在 Network 标签中找到任意 X API 请求
6. 复制 Request Headers 中的 `authorization` 值（去掉 `Bearer ` 前缀）→ `X_BEARER_TOKEN`

## 核心功能

### 1. X API 数据获取

**文件**: `backend/src/services/xService.js`

#### HomeTimeline API

```javascript
const X_API_BASE = 'https://x.com/i/api/graphql';
const HOME_TIMELINE_QUERY_ID = 'MpnCeE0hy8m5eWobPx8euw';

export async function getForYouTweets(count = 20) {
  const url = `${X_API_BASE}/${HOME_TIMELINE_QUERY_ID}/HomeTimeline`;

  const headers = {
    'authorization': `Bearer ${process.env.X_BEARER_TOKEN}`,
    'x-csrf-token': xCookies.ct0,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-client-language': 'en',
    'cookie': `auth_token=${xCookies.auth_token}; ct0=${xCookies.ct0}`,
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'referer': 'https://x.com/home',
    'origin': 'https://x.com'
  };

  const variables = {
    count,
    includePromotedContent: true,
    latestControlAvailable: true,
    requestContext: 'home',
    withCommunity: true,
    withDownvotePerspective: false,
    withReactionsMetadata: false,
    withReactionsPerspective: false,
    withSuperFollowsUserFields: true
  };

  const features = {
    blue_business_profile_image_shape_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    responsive_web_home_pinned_timelines_enabled: true,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    tweetypie_unmention_optimization_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: false,
    tweet_awards_web_tipping_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_include_grok_learning_analyzing: false,
    tweet_with_visibility_results_include_grok_analyzed_label: false,
    responsive_web_media_download_video_enabled: false
  };

  const response = await axios.get(url, {
    headers,
    params: {
      variables: JSON.stringify(variables),
      features: JSON.stringify(features)
    }
  });

  return parseTweets(response.data);
}
```

#### 解析响应数据

```javascript
function parseTweets(data) {
  const tweets = [];
  const instructions = data?.data?.home?.home_timeline_urt?.instructions || [];

  for (const instruction of instructions) {
    if (instruction.type === 'TimelineAddEntries') {
      for (const entry of instruction.entries || []) {
        const tweet = extractTweetFromEntry(entry);
        if (tweet) {
          tweets.push(tweet);
        }
      }
    }
  }

  return tweets;
}
```

#### Following 页面推文获取

```javascript
const HOME_LATEST_TIMELINE_QUERY_ID = 'MpnCeE0hy8m5eWobPx8euw';

export async function getFollowingTweets(count = 20) {
  const url = `${X_API_BASE}/${HOME_LATEST_TIMELINE_QUERY_ID}/HomeLatestTimeline`;

  const variables = {
    count,
    includePromotedContent: true,
    latestControlAvailable: true,
    requestContext: 'following',  // 区别于 For You 的 'home'
    withCommunity: true,
    withDownvotePerspective: false,
    withReactionsMetadata: false,
    withReactionsPerspective: false,
    withSuperFollowsUserFields: true
  };

  const response = await axios.get(url, { headers, params });
  return parseTweets(response.data);
}
```

#### 合并 For You 和 Following 推文

```javascript
// 并行获取两种推文
const [forYouTweets, followingTweets] = await Promise.all([
  getForYouTweets(count),
  getFollowingTweets(count)
]);

// 合并并去重
const allTweets = [...forYouTweets, ...followingTweets];
const uniqueTweetsMap = new Map();
for (const tweet of allTweets) {
  if (!uniqueTweetsMap.has(tweet.id)) {
    uniqueTweetsMap.set(tweet.id, tweet);
  }
}

// 按时间排序
const uniqueTweets = Array.from(uniqueTweetsMap.values())
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
```

### 2. 内容过滤

#### 日语推文过滤

```javascript
function isJapaneseText(text) {
  if (!text) return false;
  // 检测平假名和片假名
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  return japaneseRegex.test(text);
}
```

**过滤流程**:
```javascript
return tweets.filter(tweet => {
  const isJapanese = isJapaneseText(tweet.text);
  const isRendered = isPostRendered(tweet.id);
  return !isJapanese && !isRendered;
});
```

### 3. 数据格式化

#### 推文格式化

```javascript
function formatTweet(tweetData) {
  const tweet = tweetData.legacy || tweetData;
  const user = tweetData.core?.user_results?.result || {};

  // 用户信息分散在两个位置
  const userCore = user.core || {};      // name, screen_name, location, created_at
  const userLegacy = user.legacy || {};  // description, followers_count, friends_count

  // 获取长推文完整文本
  const noteTweetText = tweetData.note_tweet?.note_tweet_results?.result?.text;
  const fullText = noteTweetText || tweet.full_text || tweet.text || '';
  const isLongText = !!noteTweetText || fullText.length > 280;

  return {
    id: tweet.id_str,
    text: fullText,
    isLongText,
    createdAt: tweet.created_at,
    author: {
      id: tweet.user_id_str,
      name: userCore.name,
      username: userCore.screen_name,
      avatar: user.avatar?.image_url?.replace('_normal', ''),
      description: userLegacy.description,
      location: userCore.location,
      createdAt: userCore.created_at,
      followingCount: userLegacy.friends_count,
      followersCount: userLegacy.followers_count
    },
    metrics: {
      replies: tweet.reply_count,
      retweets: tweet.retweet_count,
      likes: tweet.favorite_count,
      views: tweetData.views?.count
    },
    media: extractMedia(tweet),
    entities: tweet.entities
  };
}
```

#### 媒体提取

```javascript
function extractMedia(tweet) {
  const media = tweet.extended_entities?.media || tweet.entities?.media || [];
  return media.map(m => ({
    type: m.type, // photo, video, animated_gif
    url: m.media_url_https,
    displayUrl: m.display_url,
    video_info: m.video_info
  }));
}
```

### 4. SQLite 数据库

**文件**: `backend/src/db/sqlite.js`

#### 数据库初始化

```javascript
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/posts.db');

// 确保数据目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS read_posts (
    id TEXT PRIMARY KEY,
    tweet_id TEXT NOT NULL UNIQUE,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建索引
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tweet_id ON read_posts(tweet_id)
`);
```

#### 数据库操作函数

```javascript
// 检查推文是否已加载
export function isPostLoaded(tweetId) {
  const stmt = db.prepare('SELECT 1 FROM read_posts WHERE tweet_id = ?');
  return !!stmt.get(tweetId);
}

// 批量标记为已加载（is_read=0）
export function markPostsAsLoaded(tweetIds) {
  if (!tweetIds || tweetIds.length === 0) return;

  const insert = db.prepare('INSERT OR IGNORE INTO read_posts (tweet_id, is_read) VALUES (?, 0)');
  const transaction = db.transaction((ids) => {
    for (const id of ids) {
      insert.run(id);
    }
  });

  transaction(tweetIds);
}

// 标记单条为已读/未读
export function markPostAsRead(tweetId, isRead = true) {
  try {
    const stmt = db.prepare('UPDATE read_posts SET is_read = ? WHERE tweet_id = ?');
    stmt.run(isRead ? 1 : 0, tweetId);
  } catch (err) {
    console.error('Error marking post as read:', err);
  }
}

// 获取统计
export function getReadStats() {
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM read_posts');
  const readStmt = db.prepare('SELECT COUNT(*) as count FROM read_posts WHERE is_read = 1');
  const unreadStmt = db.prepare('SELECT COUNT(*) as count FROM read_posts WHERE is_read = 0');

  return {
    total: totalStmt.get()?.count || 0,
    read: readStmt.get()?.count || 0,
    unread: unreadStmt.get()?.count || 0
  };
}

// 兼容旧函数名
export function isPostRendered(tweetId) {
  return isPostLoaded(tweetId);
}

export function markPostsAsRendered(tweetIds) {
  return markPostsAsLoaded(tweetIds);
}

export function getRenderedPostCount() {
  const stats = getReadStats();
  return stats.total;
}
```

#### 数据迁移

```javascript
// 从旧表迁移数据
try {
  const oldTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='rendered_posts'").get();
  if (oldTableExists) {
    db.exec(`
      INSERT OR IGNORE INTO read_posts (tweet_id, is_read, created_at)
      SELECT tweet_id, 1, created_at FROM rendered_posts
    `);
    db.exec(`DROP TABLE rendered_posts`);
    console.log('Migrated data from rendered_posts to read_posts');
  }
} catch (err) {
  console.log('No old table to migrate');
}
```

### 5. API 路由

**文件**: `backend/src/routes/tweets.js`

#### 路由列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tweets/for-you | 获取推文列表 |
| GET | /api/tweets/health | 健康检查 |
| POST | /api/tweets/mark-rendered | 标记推文为已加载 |
| GET | /api/tweets/rendered-count | 获取已加载数量 |
| POST | /api/tweets/mark-read | 标记已读/未读 |
| GET | /api/tweets/read-stats | 获取已读统计 |

#### 获取推文

```javascript
router.get('/for-you', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20;
    const tweets = await getForYouTweets(count);

    res.json({
      success: true,
      count: tweets.length,
      data: tweets
    });
  } catch (error) {
    console.error('Error in /for-you route:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

#### 标记已读/未读

```javascript
router.post('/mark-read', (req, res) => {
  const { tweetId, isRead } = req.body;

  if (!tweetId) {
    return res.status(400).json({
      success: false,
      error: '需要提供 tweetId'
    });
  }

  const readStatus = isRead !== false;
  markPostAsRead(tweetId, readStatus);

  res.json({
    success: true,
    message: readStatus ? '已标记为已读' : '已标记为未读',
    isRead: readStatus,
    stats: getReadStats()
  });
});
```

### 6. 入口文件

**文件**: `backend/src/index.js`

```javascript
import express from 'express';
import cors from 'cors';
import tweetsRouter from './routes/tweets.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));

// 解析 JSON
app.use(express.json());

// 路由
app.use('/api/tweets', tweetsRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend is running' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/tweets/for-you`);
});
```

## 数据表结构

### read_posts 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PRIMARY KEY | 自增主键 |
| tweet_id | TEXT UNIQUE | 推文唯一标识 |
| is_read | INTEGER DEFAULT 0 | 0=未读, 1=已读 |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP | 记录创建时间 |

```sql
CREATE TABLE read_posts (
  id TEXT PRIMARY KEY,
  tweet_id TEXT NOT NULL UNIQUE,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tweet_id ON read_posts(tweet_id);
```

## 常见问题

### 1. Cookie 过期
**现象**: API 返回 401 或空数据
**解决**: 重新从浏览器获取 auth_token 和 ct0

### 2. Query ID 过期
**现象**: "Query not found" 错误
**解决**:
1. 打开 x.com → F12 → Network
2. 找到 HomeTimeline 请求
3. 提取 Query ID（URL 中的 `graphql/QUERY_ID/HomeTimeline`）

### 3. 端口被占用
**解决**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# 或使用 npx
npx kill-port 3000
```

### 4. SQLite 权限错误
**解决**: 确保 `backend/data/` 目录有写权限

### 5. 日语过滤不准确
**注意**: 当前只检测平假名和片假名，不包含汉字

## 性能优化

### 1. 数据库连接池
better-sqlite3 默认使用连接池，无需额外配置

### 2. 事务处理
批量插入使用事务：
```javascript
const transaction = db.transaction((ids) => {
  for (const id of ids) {
    insert.run(id);
  }
});
```

### 3. 索引优化
已为 tweet_id 创建索引：
```sql
CREATE INDEX idx_tweet_id ON read_posts(tweet_id);
```

## 开发调试

### 启动开发模式

```bash
cd backend
npm run dev
```

启动日志会自动写入 `backend/backend.log` 文件。

**实时查看日志：**
```bash
# Windows
tail -f backend\backend.log

# Linux/Mac
tail -f backend/backend.log
```

### 查看数据库
```bash
# 使用 Node.js
node -e "const db = require('better-sqlite3')('./data/posts.db'); console.log(db.prepare('SELECT * FROM read_posts LIMIT 5').all());"
```

### 日志输出
- 错误日志输出到控制台
- 可使用 `DEBUG=*` 开启详细日志
