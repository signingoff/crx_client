# 雪球首页同步 + Twitter 同步文件合并 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增雪球首页 feed 同步（类似 Twitter Following timeline），并将 twitterSync.js 和 twitterUserSync.js 合并为一个文件（统一 2 分钟间隔）。

**Architecture:** 雪球首页 feed 通过 `xueqiu.com/v2/statuses/home_timeline.json` 拉取，解析后存入现有 `xueqiu_posts` 表，与监控用户帖子共用同一个 5 分钟 interval。Twitter 两个同步文件合并到 `twitterSync.js`，单一 interval 2 分钟，对外接口不变。

**Tech Stack:** Node.js, Express, axios, Supabase (@supabase/supabase-js)

---

## 关键文件说明

- `backend/src/services/xueqiuService.js` — 雪球 API 调用层，default export 对象
- `backend/src/services/xueqiuSync.js` — 雪球同步定时任务
- `backend/src/db/supabase.js` — 数据库操作，`saveXueqiuPosts(posts, userId, userScreenName)` 已有 upsert
- `backend/src/services/twitterSync.js` — Twitter following timeline 同步
- `backend/src/services/twitterUserSync.js` — Twitter 监控用户同步（将被删除）
- `backend/src/index.js` — 启动入口，注册同步任务
- `backend/src/routes/twitter.js` — Twitter API 路由

---

## Task 1：xueqiuService.js — 新增 getHomeTimeline()

**Files:**
- Modify: `backend/src/services/xueqiuService.js`

**Step 1: 在 `getCookie` 函数之后、`getUserTimeline` 之前插入新函数**

在 `xueqiuService.js` 文件中，找到 `getCookie()` 函数结束的位置（约第 51 行），在其后添加：

```js
/**
 * 获取雪球首页 feed（关注的人发布的帖子）
 * @param {number} count - 获取数量
 */
async function getHomeTimeline(count = 20) {
  try {
    const cookie = await getCookie();
    const response = await axios.get(
      `https://xueqiu.com/v2/statuses/home_timeline.json?count=${count}`,
      {
        headers: {
          'Cookie': `xq_a_token=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://xueqiu.com/'
        },
        timeout: 30000
      }
    );
    return response.data;
  } catch (e) {
    console.log('getHomeTimeline 失败:', e.message);
    return { statuses: [] };
  }
}
```

**Step 2: 将 `getHomeTimeline` 加入 default export**

找到文件末尾的 `export default { ... }`，在其中加入 `getHomeTimeline`：

```js
export default {
  getUserTimeline,
  getHomeTimeline,       // 新增
  getUserInfoByScreenName,
  parseTimelineResponse,
  parseTimelineItem,
  closeBrowser,
  getBrowser
};
```

**Step 3: 验证**

启动后端：`cd backend && node src/index.js`
无报错即可（`getHomeTimeline` 是异步函数，不会在启动时立即调用）。

**Step 4: Commit**

```bash
git add backend/src/services/xueqiuService.js
git commit -m "feat: xueqiuService 新增 getHomeTimeline"
```

---

## Task 2：xueqiuSync.js — 新增 syncHomeTimeline()

**Files:**
- Modify: `backend/src/services/xueqiuSync.js`

**Step 1: 在 `syncXueqiuPosts()` 函数内末尾添加首页同步调用**

找到 `syncXueqiuPosts()` 函数（约第 39 行），在 `console.log('批量同步完成')` 之前追加调用：

```js
// 同步首页 feed
await syncHomeTimeline();
```

完整函数末尾如下：

```js
async function syncXueqiuPosts() {
  try {
    const users = await getXueqiuUsers();

    if (users.length === 0) {
      console.log('没有需要同步的雪球用户');
    } else {
      const userIds = users.map(u => u.user_id.toString());
      console.log(`开始同步 ${userIds.length} 个雪球用户的帖子...`);
      for (const targetUserId of userIds) {
        await syncSingleUser(targetUserId);
      }
    }

    // 同步首页 feed
    await syncHomeTimeline();

    console.log('批量同步完成');
  } catch (err) {
    console.error('雪球同步失败:', err.message);
  }
}
```

**Step 2: 在 `syncSingleUser` 函数之后添加 `syncHomeTimeline()` 函数**

```js
/**
 * 同步雪球首页 feed（关注的人的帖子）
 */
async function syncHomeTimeline() {
  try {
    console.log('同步雪球首页 feed...');
    const result = await xueqiuService.getHomeTimeline(20);
    const parsed = xueqiuService.parseTimelineResponse(result);

    if (parsed.statuses.length === 0) {
      console.log('  ○ 首页 feed 无新内容');
      return;
    }

    const newCount = await saveXueqiuPosts(parsed.statuses, 0, '');
    console.log(`  ✓ 首页 feed 新增 ${newCount} 条`);
  } catch (err) {
    console.error('首页 feed 同步失败:', err.message);
  }
}
```

**Step 3: 验证**

重启后端，观察 5 分钟内日志中出现 `同步雪球首页 feed...` 字样。
也可手动触发：`curl http://localhost:3000/api/xueqiu/sync`，日志中应看到首页 feed 同步输出。

**Step 4: Commit**

```bash
git add backend/src/services/xueqiuSync.js
git commit -m "feat: xueqiuSync 新增首页 feed 同步"
```

---

## Task 3：合并 twitterUserSync.js → twitterSync.js

**Files:**
- Modify: `backend/src/services/twitterSync.js`
- Delete: `backend/src/services/twitterUserSync.js`

**Step 1: 在 `twitterSync.js` 顶部补充 import**

当前 `twitterSync.js` 第 1-2 行：
```js
import { getFollowingTweets } from './xService.js';
import { saveTwitterPosts } from '../db/supabase.js';
```

改为：
```js
import { getFollowingTweets, getUserTweets } from './xService.js';
import { saveTwitterPosts, getTweetUsers } from '../db/supabase.js';
```

**Step 2: 将 `syncInterval` 改为单一变量控制两个任务**

当前有一个 `let syncInterval = null;`，保持不变，但 `startTwitterSync` 改为同时跑两个同步。

**Step 3: 修改 `startTwitterSync` 和 `stopTwitterSync`**

将 `startTwitterSync` 改为运行 `syncAll()`，并添加第二个 interval 变量：

```js
let followingInterval = null;
let userInterval = null;

export function startTwitterSync(intervalMs = 120000) {
  if (followingInterval || userInterval) {
    console.log('Twitter 同步任务已在运行中');
    return;
  }
  console.log(`启动 Twitter 同步任务，间隔 ${intervalMs / 1000} 秒`);
  syncFollowingTimeline();
  syncTwitterUsers();
  followingInterval = setInterval(syncFollowingTimeline, intervalMs);
  userInterval = setInterval(syncTwitterUsers, intervalMs);
}

export function stopTwitterSync() {
  if (followingInterval) {
    clearInterval(followingInterval);
    followingInterval = null;
  }
  if (userInterval) {
    clearInterval(userInterval);
    userInterval = null;
  }
  console.log('Twitter 同步任务已停止');
}
```

注意：删除旧的 `let syncInterval = null;`。

**Step 4: 将原 `syncTwitterPosts` 重命名为 `syncFollowingTimeline`**

原函数名 `syncTwitterPosts` → `syncFollowingTimeline`（内容不变，只改名）：

```js
async function syncFollowingTimeline() {
  try {
    console.log('开始同步 Twitter Following 推文...');
    const count = 30;
    const followingTweets = await getFollowingTweets(count);
    // ... 后续逻辑不变
    console.log(`✓ 同步 ${uniqueTweets.length} 条 Twitter Following 推文`);
  } catch (err) {
    console.error('Twitter Following 同步失败:', err.message);
  }
}
```

**Step 5: 将 `twitterUserSync.js` 中的 `syncTwitterUsers` 和 `syncSingleUser` 搬入**

在 `syncFollowingTimeline` 函数之后，追加以下两个函数（从 `twitterUserSync.js` 复制）：

```js
/**
 * 同步所有监控用户的推文
 */
async function syncTwitterUsers() {
  try {
    const users = await getTweetUsers();
    if (users.length === 0) {
      console.log('没有需要同步的 Twitter 用户');
      return;
    }
    console.log(`开始同步 ${users.length} 个 Twitter 用户的推文...`);
    for (const user of users) {
      await syncSingleUser(user);
    }
    console.log('Twitter 用户推文同步完成');
  } catch (err) {
    console.error('Twitter 用户同步失败:', err.message);
  }
}

async function syncSingleUser(user) {
  try {
    const tweets = await getUserTweets(user.user_id, 20);
    if (!tweets.length) {
      console.log(`  ○ ${user.screen_name || user.user_id}: 无推文`);
      return;
    }

    const dbPosts = tweets.map(tweet => ({
      tweet_id: tweet.id,
      text: tweet.text,
      created_at: new Date(tweet.createdAt).toISOString(),
      user_id: user.user_id,
      user_name: tweet.author?.name || user.screen_name || '',
      user_screen_name: tweet.author?.username || user.screen_name || '',
      avatar_url: tweet.author?.avatar || user.profile_image_url || '',
      replies_count: tweet.metrics?.replies || 0,
      retweets_count: tweet.metrics?.retweets || 0,
      likes_count: tweet.metrics?.likes || 0,
      media: tweet.media?.length ? tweet.media : null,
      entities: tweet.entities || null,
      article: tweet.article || null,
      is_for_you: false,
    }));

    await saveTwitterPosts(dbPosts);
    console.log(`  ✓ ${user.screen_name || user.user_id}: 同步 ${dbPosts.length} 条`);
  } catch (err) {
    console.error(`  ✗ 用户 ${user.user_id} 同步失败:`, err.message);
  }
}
```

**Step 6: 更新 `triggerTwitterSync` 并新增 `triggerTwitterUserSync` 导出**

```js
export async function triggerTwitterSync() {
  await syncFollowingTimeline();
  return { success: true, message: 'Twitter Following 同步已触发' };
}

export async function triggerTwitterUserSync() {
  await syncTwitterUsers();
  return { success: true, message: 'Twitter 用户同步已触发' };
}
```

**Step 7: 删除 twitterUserSync.js**

```bash
git rm backend/src/services/twitterUserSync.js
```

**Step 8: Commit**

```bash
git add backend/src/services/twitterSync.js
git commit -m "feat: 合并 twitterUserSync 到 twitterSync，统一 2 分钟间隔"
```

---

## Task 4：更新 index.js 和 routes/twitter.js

**Files:**
- Modify: `backend/src/index.js`
- Modify: `backend/src/routes/twitter.js`

**Step 1: 修改 index.js**

找到以下两行并删除：
```js
import { startTwitterUserSync } from './services/twitterUserSync.js';
// ...
startTwitterUserSync(120000);
```

`startTwitterSync(120000)` 保留不变（它现在同时启动两个任务）。

**Step 2: 修改 routes/twitter.js 的 import**

找到：
```js
import { triggerTwitterUserSync } from '../services/twitterUserSync.js';
```

改为：
```js
import { triggerTwitterUserSync } from '../services/twitterSync.js';
```

**Step 3: 验证**

```bash
cd backend && node src/index.js
```

期望日志：
```
启动 Twitter 同步任务，间隔 120 秒
启动雪球帖子同步任务，间隔 300 秒
```

无 `twitterUserSync` 相关报错。

**Step 4: 验证手动触发接口**

```bash
curl -X POST http://localhost:3000/api/twitter/users/sync
# 期望: {"success":true,"message":"Twitter 用户同步已触发"}

curl -X POST http://localhost:3000/api/twitter/sync
# 期望: {"success":true,"message":"Twitter Following 同步已触发"}

curl http://localhost:3000/api/xueqiu/sync
# 期望: {"success":true,"message":"同步已触发"}
# 后端日志中出现: 同步雪球首页 feed...
```

**Step 5: Commit**

```bash
git add backend/src/index.js backend/src/routes/twitter.js
git commit -m "chore: index.js 和 twitter.js 更新 import，移除 twitterUserSync"
```

---

## Task 5：部署

**Step 1: push 触发 Render 自动部署**

```bash
git push origin main
```

**Step 2: 验证 Render 日志**

在 Render dashboard 确认：
- 无构建报错
- 启动日志中出现 `启动 Twitter 同步任务` 和 `启动雪球帖子同步任务`
- 没有 `Cannot find module './services/twitterUserSync.js'` 类报错
