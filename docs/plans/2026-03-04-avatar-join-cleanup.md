# 雪球头像 Join + 死代码清理 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 停止向 `xueqiu_posts.avatar` 冗余写入，改从 `xueqiu_users.profile_image_url` join 获取头像；删除 5 个死代码路由和若干无用代码。

**Architecture:** DB 层（supabase.js）新增私有 `normalizeAvatar`，`getAllXueqiuPosts` 和 `getXueqiuPosts` 分别做第二次 Supabase 查询并 merge 头像到返回数据；路由层只需删除冗余逻辑。`xueqiuSync.js` 修改为无论有无新帖都保存用户信息。

**Tech Stack:** Node.js + Express + Supabase JS SDK + Vue 3

**Design doc:** `docs/plans/2026-03-04-avatar-join-cleanup-design.md`

---

### Task 1: DB 层 — 新增 normalizeAvatar，停止写入 avatar

**Files:**
- Modify: `backend/src/db/supabase.js`

**Step 1: 在 `supabase.js` 顶部（常量区，约第 203 行之前）新增私有函数**

```js
function normalizeAvatar(url) {
  if (!url) return ''
  const firstUrl = url.split(',')[0]
  return firstUrl.startsWith('http')
    ? firstUrl
    : 'https://xavatar.imedao.com/' + firstUrl + '!240x240.jpg'
}
```

**Step 2: 删除 `saveXueqiuPosts()` 中的 avatar 字段**

定位 `saveXueqiuPosts`（约第 417 行），找到 `insertData` 映射中的这一行并删除：
```js
avatar: post.user?.profile_image_url || ''
```

**Step 3: 验证 — 启动后端，手动触发 sync，观察日志**

```bash
cd backend && node src/index.js
# 另一终端
curl http://localhost:3000/api/xueqiu/sync
```
预期：日志无报错，sync 完成。

**Step 4: Commit**

```bash
git add backend/src/db/supabase.js
git commit -m "refactor: 停止向 xueqiu_posts.avatar 写入，新增 normalizeAvatar helper"
```

---

### Task 2: DB 层 — getAllXueqiuPosts join users 头像

**Files:**
- Modify: `backend/src/db/supabase.js`（`getAllXueqiuPosts` 函数，约第 495 行）

**Step 1: 替换 `getAllXueqiuPosts` 的 return 逻辑**

找到：
```js
if (error) throw error;
return { posts: data || [], total: count || 0 };
```

替换为：
```js
if (error) throw error;

const posts = data || [];
if (posts.length === 0) return { posts: [], total: count || 0 };

// Join user avatars
const userIds = [...new Set(posts.map(p => p.user_id))]
const { data: users } = await supabase
  .from('xueqiu_users')
  .select('user_id, profile_image_url')
  .in('user_id', userIds)
const userMap = Object.fromEntries(
  (users || []).map(u => [u.user_id, normalizeAvatar(u.profile_image_url)])
)
return {
  posts: posts.map(p => ({ ...p, avatar: userMap[p.user_id] || '' })),
  total: count || 0
};
```

**Step 2: 验证 — 调用 /posts 接口**

```bash
curl "http://localhost:3000/api/xueqiu/posts?page=1&limit=5" | jq '.data.posts[0].avatar'
```
预期：返回非空 https:// 头像 URL。

**Step 3: Commit**

```bash
git add backend/src/db/supabase.js
git commit -m "refactor: getAllXueqiuPosts join xueqiu_users 获取头像"
```

---

### Task 3: DB 层 — getXueqiuPosts join users 头像

**Files:**
- Modify: `backend/src/db/supabase.js`（`getXueqiuPosts` 函数，约第 467 行）

**Step 1: 替换 `getXueqiuPosts` 的 return 逻辑**

找到：
```js
if (error) {
  console.error('获取雪球帖子失败:', error.message);
  return [];
}

return data || [];
```

替换为：
```js
if (error) {
  console.error('获取雪球帖子失败:', error.message);
  return [];
}

const posts = data || [];
if (posts.length === 0) return [];

// Join user avatar
const { data: userRow } = await supabase
  .from('xueqiu_users')
  .select('profile_image_url')
  .eq('user_id', userId)
  .single()
const avatar = normalizeAvatar(userRow?.profile_image_url)
return posts.map(p => ({ ...p, avatar }));
```

**Step 2: 验证 — 调用 /saved/:userId 接口**

```bash
# 用真实的 userId（从 xueqiu_users 表中取一个）
curl "http://localhost:3000/api/xueqiu/saved/7433300125" | jq '.[0].avatar'
```
预期：返回非空头像 URL。

**Step 3: Commit**

```bash
git add backend/src/db/supabase.js
git commit -m "refactor: getXueqiuPosts join xueqiu_users 获取头像"
```

---

### Task 4: 路由层 — 简化 /posts 和 /saved/:userId

**Files:**
- Modify: `backend/src/routes/xueqiu.js`

**Step 1: 简化 `GET /posts` 路由（约第 200 行）**

删除 `normalizeAvatar` 内部函数和 `normalizedPosts` 映射，替换为：
```js
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const { posts, total } = await getAllXueqiuPosts(page, limit);

    res.json({
      success: true,
      data: {
        posts,
        total,
        page,
        hasMore: page * limit < total
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

**Step 2: 简化 `GET /saved/:userId` 路由（约第 161 行）**

删除 `normalizeAvatar`、`getXueqiuUser` 查询和 `postsWithAvatar` 映射，替换为：
```js
router.get('/saved/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await getXueqiuPosts(parseInt(userId), 500);

    res.json({
      success: true,
      data: posts
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
```

**Step 3: 验证两个接口**

```bash
curl "http://localhost:3000/api/xueqiu/posts?limit=2" | jq '.data.posts[0] | {avatar, user_screen_name}'
curl "http://localhost:3000/api/xueqiu/saved/7433300125" | jq '.[0] | {avatar, user_screen_name}'
```
预期：两个接口均返回正确头像。

**Step 4: Commit**

```bash
git add backend/src/routes/xueqiu.js
git commit -m "refactor: 路由层移除 normalizeAvatar，头像由 DB 层提供"
```

---

### Task 5: 路由层 — 删除 5 个死代码路由

**Files:**
- Modify: `backend/src/routes/xueqiu.js`

**Step 1: 删除以下 5 个路由处理器**（含注释块）

| 路由 | 约行号 |
|------|-------|
| `GET /user/:userId`（live timeline）| ~12 |
| `GET /user/:userId/all` | ~56 |
| `GET /user/:userId/info` | ~102 |
| `GET /init` | ~126 |
| `GET /user-detail/:userId` | ~286 |

逐一选中从注释行到路由结束的 `});` 并删除。

**Step 2: 精简第 1 行 import**

当前：
```js
import xueqiuService from '../services/xueqiuService.js';
import { ensureXueqiuPostsTable, getXueqiuPosts, getAllXueqiuPosts, getXueqiuUsers, getXueqiuUser, ensureXueqiuUsersTable, saveXueqiuUser, deleteXueqiuUser, getXueqiuUserPostCounts } from '../db/supabase.js';
```

替换为（删除 `xueqiuService` 整行，删除 `ensureXueqiuPostsTable`、`getXueqiuUser`）：
```js
import { getXueqiuPosts, getAllXueqiuPosts, getXueqiuUsers, ensureXueqiuUsersTable, saveXueqiuUser, deleteXueqiuUser, getXueqiuUserPostCounts } from '../db/supabase.js';
```

**Step 3: 验证后端启动无报错**

```bash
cd backend && node src/index.js
```
预期：启动日志无 "Cannot find" 或 import 报错。

**Step 4: 验证死代码路由返回 404**

```bash
curl -s http://localhost:3000/api/xueqiu/init | jq '.success'
curl -s "http://localhost:3000/api/xueqiu/user/123" | jq
```
预期：返回 404 或 Express 默认 Cannot GET 响应。

**Step 5: Commit**

```bash
git add backend/src/routes/xueqiu.js
git commit -m "chore: 删除 5 个未使用的后端路由及冗余 import"
```

---

### Task 6: 同步服务 — 始终保存用户信息

**Files:**
- Modify: `backend/src/services/xueqiuSync.js`（`syncSingleUser` 函数，约第 67 行）

**Step 1: 在 `newPosts = []` 和 `reachedKnown = false` 声明处，新增 `apiUserInfo`**

```js
const newPosts = [];
let reachedKnown = false;
let apiUserInfo = null;   // 新增
```

**Step 2: 在 for 循环内，第一页时捕获用户信息**

找到：
```js
const parsed = xueqiuService.parseTimelineResponse(result);
```

在其前（或后）插入：
```js
// 第一页时记录用户信息
if (page === 1 && statuses.length > 0) {
  apiUserInfo = statuses[0]?.user || null;
}
```

**Step 3: 将现有的 `if (newPosts.length > 0)` 块中的 `saveXueqiuUser` 提取到外部**

删除原有的：
```js
if (newPosts.length > 0) {
  let userScreenName = newPosts[0]?.user?.screen_name || targetUserId.toString();
  userScreenName = userScreenName.replace(/\s*[-–]\s*雪球$/, '').trim();

  const userInfo = newPosts[0]?.user;
  if (userInfo) {
    await saveXueqiuUser({ ... });
  }

  await saveXueqiuPosts(newPosts, parseInt(targetUserId), userScreenName);
  console.log(`  ✓ ${userScreenName}: 新增 ${newPosts.length} 条`);
} else {
  console.log(`  ○ 用户 ${targetUserId}: 无新帖子`);
}
```

替换为：
```js
// 无论有无新帖，始终更新用户信息（含 profile_image_url）
if (apiUserInfo) {
  const userScreenName = (apiUserInfo.screen_name || targetUserId.toString())
    .replace(/\s*[-–]\s*雪球$/, '').trim();
  await saveXueqiuUser({
    id: apiUserInfo.id || parseInt(targetUserId),
    user_id: parseInt(targetUserId),
    screen_name: userScreenName,
    profile_image_url: apiUserInfo.profile_image_url,
    description: apiUserInfo.description,
    followers_count: apiUserInfo.followers_count,
    friends_count: apiUserInfo.friends_count,
    statuses_count: apiUserInfo.statuses_count
  });
}

if (newPosts.length > 0) {
  const userScreenName = apiUserInfo
    ? (apiUserInfo.screen_name || targetUserId.toString()).replace(/\s*[-–]\s*雪球$/, '').trim()
    : targetUserId.toString();
  await saveXueqiuPosts(newPosts, parseInt(targetUserId), userScreenName);
  console.log(`  ✓ ${userScreenName}: 新增 ${newPosts.length} 条`);
} else {
  console.log(`  ○ 用户 ${targetUserId}: 无新帖子`);
}
```

**Step 4: 验证 — 触发 sync，检查用户头像是否更新**

```bash
curl -s http://localhost:3000/api/xueqiu/sync
curl -s http://localhost:3000/api/xueqiu/users | jq '.[0] | {user_id, screen_name, profile_image_url}'
```
预期：`profile_image_url` 非空。

**Step 5: Commit**

```bash
git add backend/src/services/xueqiuSync.js
git commit -m "fix: syncSingleUser 无论有无新帖都更新用户头像信息"
```

---

### Task 7: 前端 — 删除 XueqiuSettingsView 空定时器

**Files:**
- Modify: `frontend/src/views/XueqiuSettingsView.vue`

**Step 1: 删除以下三处代码**

1. 变量声明（约第 97 行）：
   ```js
   let syncTimer = null
   ```

2. `onMounted` 中的赋值（约第 108 行）：
   ```js
   syncTimer = setInterval(() => {}, 5000) // 保持活跃
   ```

3. `onUnmounted` 中的 `clearInterval`（约第 112 行）：
   ```js
   if (syncTimer) clearInterval(syncTimer)
   ```
   （如果 `onUnmounted` 体内只剩这一行，整个 `onUnmounted` 也一并删除）

**Step 2: 验证前端编译无报错**

```bash
cd frontend && npm run build
```
预期：Build 成功，无 warning/error。

**Step 3: Commit**

```bash
git add frontend/src/views/XueqiuSettingsView.vue
git commit -m "chore: 删除 XueqiuSettingsView 无效空定时器"
```

---

### Task 8: 端到端验证

**Step 1: 启动前后端**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

**Step 2: 验证清单**

| 场景 | 预期 |
|------|------|
| 访问 `/xueqiu` | 帖子列表显示，头像正常 |
| 点击用户头像 → `/xueqiu/user/:id` | 用户帖子显示，头像正常 |
| `/xueqiu/settings` 页面加载 | 无报错，用户列表正常 |
| 添加新用户 ID → 等待 sync | 用户出现在列表，头像同步后显示 |
| 删除用户 | 正常 |
| 手动点击"立即同步" | 同步完成，帖子数更新 |

**Step 3: Final commit（如有未提交内容）**

```bash
git add -A
git status  # 确认无遗漏
```
