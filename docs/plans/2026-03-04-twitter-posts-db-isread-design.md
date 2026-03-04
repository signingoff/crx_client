# Twitter Posts 持久化 + is_read 统一设计

**日期:** 2026-03-04

## 目标

1. X.com 推文持久化到数据库（后台同步），不再实时拉取
2. `read_posts` 表改名为 `twitter_posts` 并扩展内容字段
3. `xueqiu_posts` 增加 `is_read` 字段，删除 `user_screen_name`（改从 `xueqiu_users` join 读取）
4. 首页三连击对两个来源都能标记已读，视觉统一

---

## 方案

方案 A（已选）：平行表 + 独立同步服务，镜像现有 xueqiu 模式。

---

## 数据库

### `twitter_posts`（从 `read_posts` 改名 + 扩展）

```sql
ALTER TABLE read_posts RENAME TO twitter_posts;
ALTER TABLE twitter_posts RENAME COLUMN tweet_id TO id;

ALTER TABLE twitter_posts
  ADD COLUMN text TEXT,
  ADD COLUMN created_at BIGINT,
  ADD COLUMN user_id TEXT,
  ADD COLUMN user_name TEXT,
  ADD COLUMN user_screen_name TEXT,
  ADD COLUMN avatar_url TEXT,
  ADD COLUMN replies_count INT DEFAULT 0,
  ADD COLUMN retweets_count INT DEFAULT 0,
  ADD COLUMN likes_count INT DEFAULT 0,
  ADD COLUMN media JSONB,
  ADD COLUMN entities JSONB,
  ADD COLUMN article JSONB;
-- is_read 列已存在
```

### `xueqiu_posts`

```sql
ALTER TABLE xueqiu_posts
  ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

ALTER TABLE xueqiu_posts
  DROP COLUMN user_screen_name;
```

`user_screen_name` 改从 `xueqiu_users` join 读取（已有 join 逻辑扩展即可）。

---

## 后端

### 新增 `twitterSync.js`

镜像 `xueqiuSync.js`，定时调用 `xService.js` 拉取 For You 推文并 upsert 到 `twitter_posts`：

- `startTwitterSync(intervalMs = 300000)` — 5 分钟间隔
- `syncTwitterPosts()` — 拉取 → 存库
- 在 `index.js` 启动时调用

### `supabase.js` 新增函数

| 函数 | 说明 |
|------|------|
| `saveTwitterPosts(tweets)` | upsert into twitter_posts |
| `getAllTwitterPosts(page, limit)` | 分页读取，按 created_at desc |
| `markTwitterPostRead(id, isRead)` | UPDATE twitter_posts SET is_read |
| `markXueqiuPostRead(id, isRead)` | UPDATE xueqiu_posts SET is_read |

旧函数 `markPostAsRead` / `isPostRead` / `getReadStats` 删除。

`getAllXueqiuPosts` / `getXueqiuPosts` 扩展 join，返回 `xueqiu_users.screen_name`。

### 路由变更

| 新增/修改 | 路径 | 说明 |
|-----------|------|------|
| 新增文件 | `backend/src/routes/twitter.js` | twitter 相关路由 |
| 新增 | `GET /api/twitter/posts` | 从 DB 分页读取 |
| 新增 | `POST /api/twitter/posts/:id/read` | 标记推文已读/未读 |
| 新增 | `POST /api/xueqiu/posts/:id/read` | 标记雪球帖子已读/未读 |

---

## 前端

### `HomeView.vue`

- `loadTweets()` 改为并行从 DB 读取两个来源：
  ```js
  const [twitterRes, xueqiuRes] = await Promise.all([
    axios.get('/api/twitter/posts', { params: { page: 1, limit: 30 } }),
    axios.get('/api/xueqiu/posts', { params: { page: 1, limit: 30 } })
  ])
  ```
- 轮询间隔从 15 秒改为 **8 秒**
- 新增 `normalizeTwitterPost(post)` 从 DB 字段组装 TweetCard 格式（含 `is_read`）
- 移除 `fetchForYouTweets` 调用

### `TweetCard.vue`

- 三连击根据 `tweet.source` 调不同接口：
  - `twitter` → `POST /api/twitter/posts/:id/read`
  - `xueqiu` → `POST /api/xueqiu/posts/:id/read`
- 绿色 ✓ 已读标记对两个来源生效
- 初始渲染时读取 `tweet.is_read` 设置初始状态

### 移除

- `frontend/src/api/tweets.js` 中的 `fetchForYouTweets`
- HomeView 中原有的 `fetchForYouTweets` 调用
