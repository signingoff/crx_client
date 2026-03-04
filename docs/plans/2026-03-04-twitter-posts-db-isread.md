# Twitter Posts 持久化 + is_read 统一 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** X.com 推文持久化到数据库（后台同步），`twitter_posts` 和 `xueqiu_posts` 统一支持三连击已读标记。

**Architecture:** 新建 `twitterSync.js` 后台定时同步（镜像 xueqiuSync.js），推文存入 `twitter_posts` 表（由 `read_posts` 改名扩展）；前端从 DB 读取两个来源，TweetCard 三连击根据 `tweet.source` 调对应已读接口；`xueqiu_posts` 去掉 `user_screen_name` 列，改从 `xueqiu_users` join。

**Tech Stack:** Node.js + Express + Supabase JS SDK + Vue 3 + Axios

**Design doc:** `docs/plans/2026-03-04-twitter-posts-db-isread-design.md`

---

### Task 1: SQL 迁移（在 Supabase SQL Editor 手动执行）

**Files:**
- 无代码文件，在 Supabase 控制台 SQL Editor 执行

**Step 1: 执行以下 SQL**

```sql
-- 1. 重命名 read_posts → twitter_posts
ALTER TABLE read_posts RENAME TO twitter_posts;

-- 3. 如果已存在 created_at 列（Supabase 自动时间戳），先改名
-- 检查：SELECT column_name FROM information_schema.columns WHERE table_name='twitter_posts';
-- 如果有 created_at 列则执行：
-- ALTER TABLE twitter_posts RENAME COLUMN created_at TO row_created_at;

-- 4. 扩展推文内容字段
ALTER TABLE twitter_posts
  ADD COLUMN IF NOT EXISTS text TEXT,
  ADD COLUMN IF NOT EXISTS created_at BIGINT,
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS user_name TEXT,
  ADD COLUMN IF NOT EXISTS user_screen_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retweets_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS media JSONB,
  ADD COLUMN IF NOT EXISTS entities JSONB,
  ADD COLUMN IF NOT EXISTS article JSONB;

-- is_read 列已存在，无需添加

-- 5. xueqiu_posts 加 is_read，删 user_screen_name
ALTER TABLE xueqiu_posts
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

ALTER TABLE xueqiu_posts
  DROP COLUMN IF EXISTS user_screen_name;
```

**Step 2: 验证**

在 Supabase Table Editor 查看：
- `twitter_posts` 列含 `id, text, created_at, user_id, user_name, user_screen_name, avatar_url, replies_count, retweets_count, likes_count, media, entities, article, is_read`
- `xueqiu_posts` 含 `is_read` 列，无 `user_screen_name` 列

---

### Task 2: supabase.js — Twitter posts CRUD 函数

**Files:**
- Modify: `backend/src/db/supabase.js`

**Step 1: 在文件末尾（`export default supabase;` 之前）新增三个函数**

```js
const TWITTER_POSTS_TABLE = 'twitter_posts';

/**
 * 保存 Twitter 推文到数据库
 * @param {Array} posts - 推文数组（已转换为 DB 格式）
 */
export async function saveTwitterPosts(posts) {
  if (!supabase || !posts.length) return false;
  try {
    const { error } = await supabase
      .from(TWITTER_POSTS_TABLE)
      .upsert(posts, { onConflict: 'id', ignoreDuplicates: false });
    if (error) {
      console.error('保存 Twitter 推文失败:', error.message);
      return false;
    }
    console.log(`保存 ${posts.length} 条 Twitter 推文`);
    return true;
  } catch (err) {
    console.error('保存 Twitter 推文异常:', err.message);
    return false;
  }
}

/**
 * 获取 Twitter 推文（分页）
 * @param {number} page - 页码（从1开始）
 * @param {number} limit - 每页数量
 */
export async function getAllTwitterPosts(page = 1, limit = 20) {
  if (!supabase) return { posts: [], total: 0 };
  try {
    const from = (page - 1) * limit;
    const to = page * limit - 1;
    const { data, count, error } = await supabase
      .from(TWITTER_POSTS_TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return { posts: data || [], total: count || 0 };
  } catch (err) {
    console.error('获取 Twitter 推文失败:', err.message);
    return { posts: [], total: 0 };
  }
}

/**
 * 标记 Twitter 推文已读/未读
 * @param {string} id - 推文 ID
 * @param {boolean} isRead - 是否已读
 */
export async function markTwitterPostRead(id, isRead = true) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from(TWITTER_POSTS_TABLE)
      .update({ is_read: isRead })
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('标记 Twitter 推文已读失败:', err.message);
    return false;
  }
}
```

**Step 2: 验证**

后端启动后执行：
```bash
curl "http://localhost:3000/api/twitter/posts?limit=2"
```
预期：`{ success: true, data: { posts: [...], total: N } }`（即使 posts 为空也返回 success）

**Step 3: Commit**

```bash
git add backend/src/db/supabase.js
git commit -m "feat: supabase.js 新增 Twitter posts CRUD 函数"
```

---

### Task 3: supabase.js — 雪球已读标记 + join screen_name + 删旧函数

**Files:**
- Modify: `backend/src/db/supabase.js`

**Step 1: 新增 markXueqiuPostRead（紧跟 markTwitterPostRead 之后）**

```js
/**
 * 标记雪球帖子已读/未读
 * @param {number} id - 帖子 ID
 * @param {boolean} isRead - 是否已读
 */
export async function markXueqiuPostRead(id, isRead = true) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from(XUEQIU_POSTS_TABLE)
      .update({ is_read: isRead })
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('标记雪球帖子已读失败:', err.message);
    return false;
  }
}
```

**Step 2: 修改 `saveXueqiuPosts()` — 删除 user_screen_name 字段**

找到 `saveXueqiuPosts` 函数内的 `insertData` 映射，删除这一行：
```js
user_screen_name: post.user?.screen_name || userScreenName,
```

**Step 3: 修改 `getAllXueqiuPosts()` — join 返回 screen_name**

找到 join users 那段（约在函数中部），将：
```js
const { data: users, error: usersError } = await supabase
  .from(XUEQIU_USERS_TABLE)
  .select('user_id, profile_image_url')
  .in('user_id', userIds)
```
改为：
```js
const { data: users, error: usersError } = await supabase
  .from(XUEQIU_USERS_TABLE)
  .select('user_id, profile_image_url, screen_name')
  .in('user_id', userIds)
```

将 `userMap` 构建改为：
```js
const userMap = Object.fromEntries(
  (users || []).map(u => [u.user_id, {
    avatar: normalizeAvatar(u.profile_image_url),
    screen_name: u.screen_name || ''
  }])
)
```

将 filteredPosts 映射改为：
```js
posts: filteredPosts.map(p => ({
  ...p,
  avatar: userMap[p.user_id]?.avatar || '',
  user_screen_name: userMap[p.user_id]?.screen_name || ''
})),
```

**Step 4: 修改 `getXueqiuPosts()` — join 返回 screen_name**

将：
```js
const { data: userRow, error: userError } = await supabase
  .from(XUEQIU_USERS_TABLE)
  .select('profile_image_url')
  .eq('user_id', userId)
  .single()
```
改为：
```js
const { data: userRow, error: userError } = await supabase
  .from(XUEQIU_USERS_TABLE)
  .select('profile_image_url, screen_name')
  .eq('user_id', userId)
  .single()
```

将 return 改为：
```js
const avatar = normalizeAvatar(userRow?.profile_image_url)
const screen_name = userRow?.screen_name || ''
return posts.map(p => ({ ...p, avatar, user_screen_name: screen_name }));
```

**Step 5: 删除旧的三个已废弃函数**

删除以下函数（含 JSDoc 注释）：
- `markPostAsRead(tweetId, isRead)` — 约第 19 行开始
- `isPostRead(tweetId)` — 约第 47 行开始
- `getReadStats()` — 约第 71 行开始

**Step 6: Commit**

```bash
git add backend/src/db/supabase.js
git commit -m "feat: supabase.js 新增雪球已读标记，join screen_name，删除废弃函数"
```

---

### Task 4: 新建 twitterSync.js

**Files:**
- Create: `backend/src/services/twitterSync.js`

**Step 1: 创建文件**

```js
import { getForYouTweets, getFollowingTweets } from './xService.js';
import { saveTwitterPosts } from '../db/supabase.js';

let syncInterval = null;

/**
 * 启动 Twitter 推文后台同步任务
 * @param {number} intervalMs - 同步间隔（毫秒），默认 5 分钟
 */
export function startTwitterSync(intervalMs = 300000) {
  if (syncInterval) {
    console.log('Twitter 同步任务已在运行中');
    return;
  }
  console.log(`启动 Twitter 同步任务，间隔 ${intervalMs / 1000} 秒`);
  syncTwitterPosts();
  syncInterval = setInterval(syncTwitterPosts, intervalMs);
}

/**
 * 停止 Twitter 推文同步任务
 */
export function stopTwitterSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Twitter 同步任务已停止');
  }
}

/**
 * 执行一次 Twitter 推文同步
 */
async function syncTwitterPosts() {
  try {
    console.log('开始同步 Twitter 推文...');
    const count = 30;

    const [forYouTweets, followingTweets] = await Promise.all([
      getForYouTweets(count),
      getFollowingTweets(count)
    ]);

    // 合并去重
    const allTweets = [...forYouTweets, ...followingTweets];
    const uniqueMap = new Map();
    for (const tweet of allTweets) {
      if (!uniqueMap.has(tweet.id)) uniqueMap.set(tweet.id, tweet);
    }
    const uniqueTweets = Array.from(uniqueMap.values());

    // 转换为 DB 格式
    const dbPosts = uniqueTweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      created_at: new Date(tweet.createdAt).getTime(),
      user_id: tweet.author?.id || tweet.author?.username || '',
      user_name: tweet.author?.name || '',
      user_screen_name: tweet.author?.username || '',
      avatar_url: tweet.author?.avatar || '',
      replies_count: tweet.metrics?.replies || 0,
      retweets_count: tweet.metrics?.retweets || 0,
      likes_count: tweet.metrics?.likes || 0,
      media: tweet.media?.length ? tweet.media : null,
      entities: tweet.entities || null,
      article: tweet.article || null,
    }));

    await saveTwitterPosts(dbPosts);
    console.log(`✓ 同步 ${uniqueTweets.length} 条 Twitter 推文`);
  } catch (err) {
    console.error('Twitter 同步失败:', err.message);
  }
}

/**
 * 手动触发一次同步
 */
export async function triggerTwitterSync() {
  await syncTwitterPosts();
  return { success: true, message: 'Twitter 同步已触发' };
}
```

**Step 2: Commit**

```bash
git add backend/src/services/twitterSync.js
git commit -m "feat: 新建 twitterSync.js，后台定时同步 Twitter 推文"
```

---

### Task 5: 新建 routes/twitter.js + 注册到 index.js

**Files:**
- Create: `backend/src/routes/twitter.js`
- Modify: `backend/src/index.js`

**Step 1: 创建 routes/twitter.js**

```js
import express from 'express';
import { getAllTwitterPosts, markTwitterPostRead } from '../db/supabase.js';
import { triggerTwitterSync } from '../services/twitterSync.js';

const router = express.Router();

/**
 * GET /api/twitter/posts?page=1&limit=20
 * 分页读取 Twitter 推文
 */
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const { posts, total } = await getAllTwitterPosts(page, limit);
    res.json({
      success: true,
      data: { posts, total, page, hasMore: page * limit < total }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/twitter/posts/:id/read
 * 标记推文已读/未读
 * Body: { isRead: boolean }
 */
router.post('/posts/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead = true } = req.body;
    await markTwitterPostRead(id, isRead);
    res.json({ success: true, isRead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/twitter/sync
 * 手动触发同步
 */
router.post('/sync', async (req, res) => {
  try {
    const result = await triggerTwitterSync();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
```

**Step 2: 修改 index.js — 注册路由 + 启动同步**

在 `startXueqiuSync` 那行之后，添加：

```js
// Twitter 路由
const twitterRouter = (await import('./routes/twitter.js')).default;
app.use('/api/twitter', twitterRouter);

// 启动 Twitter 推文同步任务
import { startTwitterSync } from './services/twitterSync.js';
startTwitterSync(300000); // 每 5 分钟同步一次
```

注意：`import { startTwitterSync }` 是静态 import，需放在文件顶部（和 `import { startXueqiuSync }` 放在一起）。动态路由注册用 `await import()`。

**Step 3: 验证**

```bash
# 启动后端
cd backend && npm run dev

# 另一终端
curl http://localhost:3000/api/twitter/posts?limit=2
# 预期：{ success: true, data: { posts: [...] } }

curl -X POST http://localhost:3000/api/twitter/sync
# 预期：{ success: true, message: 'Twitter 同步已触发' }
```

**Step 4: Commit**

```bash
git add backend/src/routes/twitter.js backend/src/index.js
git commit -m "feat: 新建 /api/twitter 路由，index.js 注册路由并启动 Twitter 同步"
```

---

### Task 6: routes/xueqiu.js — 新增已读标记路由

**Files:**
- Modify: `backend/src/routes/xueqiu.js`

**Step 1: 在 import 行添加 markXueqiuPostRead**

找到：
```js
import { getXueqiuPosts, getAllXueqiuPosts, getXueqiuUsers, ensureXueqiuUsersTable, saveXueqiuUser, deleteXueqiuUser, getXueqiuUserPostCounts } from '../db/supabase.js';
```
改为：
```js
import { getXueqiuPosts, getAllXueqiuPosts, getXueqiuUsers, ensureXueqiuUsersTable, saveXueqiuUser, deleteXueqiuUser, getXueqiuUserPostCounts, markXueqiuPostRead } from '../db/supabase.js';
```

**Step 2: 在 `router.get('/posts', ...)` 之后新增路由**

```js
/**
 * 标记雪球帖子已读/未读
 * POST /api/xueqiu/posts/:id/read
 * Body: { isRead: boolean }
 */
router.post('/posts/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead = true } = req.body;
    await markXueqiuPostRead(parseInt(id), isRead);
    res.json({ success: true, isRead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

**Step 3: 验证**

```bash
# 用真实帖子 ID 测试（从 xueqiu_posts 表取一个 id）
curl -X POST http://localhost:3000/api/xueqiu/posts/123456/read \
  -H "Content-Type: application/json" \
  -d '{"isRead": true}'
# 预期：{ success: true, isRead: true }
```

**Step 4: Commit**

```bash
git add backend/src/routes/xueqiu.js
git commit -m "feat: xueqiu 路由新增 POST /posts/:id/read 已读标记"
```

---

### Task 7: 前端 api/tweets.js — 更新函数

**Files:**
- Modify: `frontend/src/api/tweets.js`

**Step 1: 新增两个已读标记函数**

在文件末尾添加：

```js
/**
 * 标记 Twitter 推文已读/未读
 * @param {string} id - 推文 ID
 * @param {boolean} isRead - 是否已读
 */
export async function markTwitterPostRead(id, isRead) {
  const response = await axios.post(`${API_BASE}/twitter/posts/${id}/read`, { isRead })
  return response.data
}

/**
 * 标记雪球帖子已读/未读
 * @param {string|number} id - 帖子 ID
 * @param {boolean} isRead - 是否已读
 */
export async function markXueqiuPostRead(id, isRead) {
  const response = await axios.post(`${API_BASE}/xueqiu/posts/${id}/read`, { isRead })
  return response.data
}
```

**Step 2: 删除不再使用的函数**

删除以下函数（含 JSDoc）：
- `fetchForYouTweets(count)` — 改用 `/api/twitter/posts`
- `markTweetAsRead(tweetId)` — 改用 `markTwitterPostRead`
- `markTweetAsUnread(tweetId)` — 改用 `markTwitterPostRead`
- `getReadStats()` — 后端已删除
- `fetchReadStatus(tweetIds)` — 不再需要批量查询

保留：`getQueryConfig`, `updateQueryId`, `fetchQueryIdFromX`

**Step 3: Commit**

```bash
git add frontend/src/api/tweets.js
git commit -m "feat: api/tweets.js 新增 markTwitterPostRead/markXueqiuPostRead，删除废弃函数"
```

---

### Task 8: 前端 HomeView.vue — 改用 DB 接口 + 8 秒轮询

**Files:**
- Modify: `frontend/src/views/HomeView.vue`

**Step 1: 确认已有 `import axios from 'axios'`（前几次已添加，无需重复）**

**Step 2: 删除 `fetchForYouTweets` import**

找到：
```js
import { fetchForYouTweets } from '../api/tweets.js'
```
删除整行（如果 tweets.js 还有其他导入保留，只删 fetchForYouTweets）。

**Step 3: 新增 normalizeTwitterPost 函数**

在 `normalizeXueqiuPost` 函数之前插入：

```js
function normalizeTwitterPost(post) {
  return {
    id: post.id,
    text: post.text,
    createdAt: new Date(post.created_at).toISOString(),
    source: 'twitter',
    is_read: post.is_read || false,
    author: {
      name: post.user_name,
      username: post.user_screen_name,
      avatar: post.avatar_url,
    },
    metrics: {
      replies: post.replies_count || 0,
      retweets: post.retweets_count || 0,
      likes: post.likes_count || 0,
    },
    media: post.media || [],
    entities: post.entities || null,
    article: post.article || null,
  }
}
```

**Step 4: 修改 loadTweets()**

找到：
```js
const [tweetRes, xueqiuRes] = await Promise.all([
  fetchForYouTweets(20),
  axios.get('/api/xueqiu/posts', { params: { page: 1, limit: 30 } }).catch(() => null)
])

if (!tweetRes.success) {
  error.value = tweetRes.error || '获取失败'
  return
}

const xTweets = tweetRes.data
const xueqiuPosts = (xueqiuRes?.data?.data?.posts || []).map(normalizeXueqiuPost)
const allNew = [...xTweets, ...xueqiuPosts]
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
```

替换为：
```js
const [twitterRes, xueqiuRes] = await Promise.all([
  axios.get('/api/twitter/posts', { params: { page: 1, limit: 30 } }).catch(() => null),
  axios.get('/api/xueqiu/posts', { params: { page: 1, limit: 30 } }).catch(() => null)
])

const twitterPosts = (twitterRes?.data?.data?.posts || []).map(normalizeTwitterPost)
const xueqiuPosts = (xueqiuRes?.data?.data?.posts || []).map(normalizeXueqiuPost)
const allNew = [...twitterPosts, ...xueqiuPosts]
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
```

**Step 5: 将轮询间隔从 15000 改为 8000**

找到：
```js
refreshInterval = setInterval(loadTweets, 15000)
```
改为：
```js
refreshInterval = setInterval(loadTweets, 8000)
```

**Step 6: Commit**

```bash
git add frontend/src/views/HomeView.vue
git commit -m "feat: HomeView 改用 DB 接口读取 Twitter 推文，8 秒轮询"
```

---

### Task 9: 前端 TweetCard.vue — 三连击改用新端点 + is_read 初始化

**Files:**
- Modify: `frontend/src/components/TweetCard.vue`

**Step 1: 修改 import**

找到：
```js
import { markTweetAsRead, markTweetAsUnread } from '../api/tweets.js'
```
改为：
```js
import { markTwitterPostRead, markXueqiuPostRead } from '../api/tweets.js'
```

**Step 2: 修改 internalIsRead 初始化（读取 tweet.is_read）**

找到：
```js
const internalIsRead = ref(props.isRead)
```
改为：
```js
const internalIsRead = ref(props.tweet.is_read || props.isRead || false)
```

**Step 3: 修改 handleTripleClick — 根据 source 调不同接口**

找到：
```js
    try {
      if (newReadState) {
        await markTweetAsRead(props.tweet.id)
      } else {
        await markTweetAsUnread(props.tweet.id)
      }
    } catch (err) {
```
替换为：
```js
    try {
      if (props.tweet.source === 'xueqiu') {
        await markXueqiuPostRead(props.tweet.id, newReadState)
      } else {
        await markTwitterPostRead(props.tweet.id, newReadState)
      }
    } catch (err) {
```

**Step 4: 验证前端编译**

```bash
cd frontend && npm run build
```
预期：Build 成功，无 error/warning。

**Step 5: Commit**

```bash
git add frontend/src/components/TweetCard.vue
git commit -m "feat: TweetCard 三连击根据 source 调不同已读接口，初始化 is_read"
```

---

### Task 10: routes/tweets.js 清理废弃路由

**Files:**
- Modify: `backend/src/routes/tweets.js`

**Step 1: 删除废弃 import**

找到：
```js
import {
  markPostAsRead,
  getReadStats,
  isPostRead,
  setSetting
} from '../db/index.js';
```
改为（只保留 setSetting）：
```js
import { setSetting } from '../db/index.js';
```

**Step 2: 删除废弃路由处理器**（含注释块）

删除以下路由：
- `GET /api/tweets/for-you` — 已被 twitterSync + /api/twitter/posts 取代
- `POST /api/tweets/mark-read` — 已被 /api/twitter/posts/:id/read 取代
- `GET /api/tweets/read-stats` — 已删除
- `POST /api/tweets/read-status` — 已删除

保留：`GET /health`, `GET /config`, `POST /config/query-id`, `POST /config/fetch-query-id`

**Step 3: 验证后端启动无报错**

```bash
cd backend && npm run dev
# 预期：无 import 报错，无 Cannot find 错误
```

**Step 4: Commit**

```bash
git add backend/src/routes/tweets.js
git commit -m "chore: tweets.js 删除废弃路由和 import"
```

---

### Task 11: 端到端验证 + 部署

**Step 1: 本地启动并验证**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

**验证清单：**

| 场景 | 预期 |
|------|------|
| 首页加载 | Twitter + 雪球帖子混合显示，按时间倒排 |
| Twitter 推文右上角 | X SVG，点击跳转 x.com |
| 雪球帖子右上角 | ❄️，点击跳转 xueqiu.com |
| 三连击 Twitter 推文 | 绿色 ✓ 已读标记出现 |
| 三连击雪球帖子 | 绿色 ✓ 已读标记出现 |
| 再次三连击 | 已读状态切换为未读，✓ 消失 |
| 8 秒轮询 | 新帖子出现在 pending bar |
| `/api/twitter/sync` POST | 同步触发，日志正常 |

**Step 2: 部署**

```bash
cd /d/xueqiu_crx
git push origin main   # Render 自动部署后端

cd frontend
vercel --prod          # 部署前端
```
