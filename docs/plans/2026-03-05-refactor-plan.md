# Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 5 changes — remove metrics, clean up /xueqiu route, move settings to /user_settings, add For You toggle, and add Twitter user monitoring.

**Architecture:** Frontend cleanup removes unused views/routes; backend gains `is_for_you` flag on twitter_posts and a new `tweet_users` table + sync service modeled after xueqiuSync; a settings toggle controls whether the home feed filters to For You only.

**Tech Stack:** Vue 3, Express, Supabase (postgres), axios (X API cookie-based auth)

---

## Task 0: SQL Migration (manual — run in Supabase SQL Editor)

Run these two statements in Supabase → SQL Editor:

```sql
-- 1. Add is_for_you to twitter_posts
ALTER TABLE twitter_posts
  ADD COLUMN IF NOT EXISTS is_for_you BOOLEAN DEFAULT FALSE;

-- 2. Create tweet_users table
CREATE TABLE IF NOT EXISTS tweet_users (
  user_id   TEXT PRIMARY KEY,
  screen_name        TEXT,
  profile_image_url  TEXT,
  description        TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
```

No code changes. Verify in Supabase Table Editor that both changes appear.

---

## Task 1: Delete Tweet Metrics from TweetCard

**Files:**
- Modify: `frontend/src/components/TweetCard.vue`

**Step 1: Delete the metrics div and its CSS**

In the `<template>`, remove:
```html
<div class="tweet-metrics">
  <span class="metric" title="Replies">💬 {{ formatNumber(tweet.metrics.replies) }}</span>
  <span class="metric" title="Retweets">🔄 {{ formatNumber(tweet.metrics.retweets) }}</span>
  <span class="metric" title="Likes">❤️ {{ formatNumber(tweet.metrics.likes) }}</span>
  <span v-if="tweet.metrics.views" class="metric" title="Views">👁️ {{ formatNumber(tweet.metrics.views) }}</span>
</div>
```

In the `<style scoped>`, remove:
```css
.tweet-metrics {
  display: flex;
  gap: 24px;
  color: #536471;
  font-size: 13px;
}

.metric {
  cursor: pointer;
  transition: color 0.2s;
}

.metric:hover {
  color: #1d9bf0;
}
```

**Step 2: Commit**
```bash
git add frontend/src/components/TweetCard.vue
git commit -m "feat: 删除推文 metrics 显示（replies/retweets/likes）"
```

---

## Task 2: Delete /xueqiu and /xueqiu/user/:userId Routes

**Files:**
- Delete: `frontend/src/views/XueqiuView.vue`
- Delete: `frontend/src/views/XueqiuUserView.vue`
- Modify: `frontend/src/router/index.js`
- Modify: `backend/src/routes/xueqiu.js`

**Step 1: Delete the two Vue files**
```bash
rm frontend/src/views/XueqiuView.vue
rm frontend/src/views/XueqiuUserView.vue
```

**Step 2: Update router — remove deleted routes**

In `frontend/src/router/index.js`, replace entire file with:
```js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UserSettingsView from '../views/UserSettingsView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/user_settings',
    name: 'UserSettings',
    component: UserSettingsView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

**Step 3: Delete `/api/xueqiu/saved/:userId` from backend routes**

In `backend/src/routes/xueqiu.js`, remove the entire block (lines ~143-158):
```js
/**
 * 获取已保存的雪球帖子
 * GET /api/xueqiu/saved/:userId
 */
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

Also remove `getXueqiuPosts` from the import line at the top of `xueqiu.js`:
```js
// Before:
import { getXueqiuPosts, getAllXueqiuPosts, ... } from '../db/supabase.js';
// After:
import { getAllXueqiuPosts, getXueqiuUsers, ensureXueqiuUsersTable, saveXueqiuUser, deleteXueqiuUser, getXueqiuUserPostCounts, markXueqiuPostRead } from '../db/supabase.js';
```

**Step 4: Commit**
```bash
git add frontend/src/router/index.js backend/src/routes/xueqiu.js
git commit -m "feat: 删除 /xueqiu 和 /xueqiu/user 路由及对应后端接口"
```

---

## Task 3: Rename XueqiuSettingsView → UserSettingsView, Update Header

**Files:**
- Rename: `frontend/src/views/XueqiuSettingsView.vue` → `frontend/src/views/UserSettingsView.vue`
- Modify: `frontend/src/views/HomeView.vue`

**Step 1: Rename the file**
```bash
mv frontend/src/views/XueqiuSettingsView.vue frontend/src/views/UserSettingsView.vue
```

**Step 2: Update the page title and back link in `UserSettingsView.vue`**

Change the header section from:
```html
<h1>❄️ 雪球用户管理</h1>
```
To:
```html
<h1>👥 用户管理</h1>
```

**Step 3: Update `HomeView.vue` header — replace ❄️ link with 👥 link**

In the `<template>`, replace:
```html
<router-link to="/xueqiu" class="nav-link" title="雪球发言">
  ❄️
</router-link>
```
With:
```html
<router-link to="/user_settings" class="nav-link" title="用户管理">
  👥
</router-link>
```

**Step 4: Commit**
```bash
git add frontend/src/views/UserSettingsView.vue frontend/src/views/HomeView.vue
git commit -m "feat: 重命名 XueqiuSettingsView → UserSettingsView，首页导航链接改为 /user_settings"
```

---

## Task 4: Backend — Mark is_for_you in twitterSync.js

**Files:**
- Modify: `backend/src/services/twitterSync.js`

**Context:** `syncTwitterPosts()` calls both `getForYouTweets` and `getFollowingTweets`, then merges and saves. We need to tag For You tweets with `is_for_you: true` before merging.

**Step 1: Edit `twitterSync.js` — tag tweets before merging**

In `syncTwitterPosts()`, replace the merge/dedup block:
```js
// Before:
const [forYouTweets, followingTweets] = await Promise.all([
  getForYouTweets(count),
  getFollowingTweets(count)
]);

// 合并去重
const allTweets = [...forYouTweets, ...followingTweets];

// After:
const [forYouTweets, followingTweets] = await Promise.all([
  getForYouTweets(count),
  getFollowingTweets(count)
]);

// Tag source before merging
const taggedForYou = forYouTweets.map(t => ({ ...t, _isForYou: true }));
const taggedFollowing = followingTweets.map(t => ({ ...t, _isForYou: false }));
const allTweets = [...taggedForYou, ...taggedFollowing];
```

Then in the `dbPosts` mapping, add the `is_for_you` field:
```js
const dbPosts = uniqueTweets.map(tweet => ({
  tweet_id: tweet.id,
  text: tweet.text,
  created_at: new Date(tweet.createdAt).toISOString(),
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
  is_for_you: tweet._isForYou ?? false,   // ← add this line
}));
```

**Step 2: Commit**
```bash
git add backend/src/services/twitterSync.js
git commit -m "feat: twitterSync 同步时标记 is_for_you 字段"
```

---

## Task 5: Backend — supabase.js: getAllTwitterPosts 支持 forYouOnly

**Files:**
- Modify: `backend/src/db/supabase.js`

**Step 1: Update `getAllTwitterPosts` signature and query**

Current function at line ~573:
```js
export async function getAllTwitterPosts(page = 1, limit = 20) {
  if (!supabase) return { posts: [], total: 0 };
  try {
    const from = (page - 1) * limit;
    const to = page * limit - 1;
    const { data, count, error } = await supabase
      .from(TWITTER_POSTS_TABLE)
      .select('*', { count: 'exact' })
      .neq('is_read', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return { posts: data || [], total: count || 0 };
  } catch (err) {
    console.error('获取 Twitter 推文失败:', err.message);
    return { posts: [], total: 0 };
  }
}
```

Replace with:
```js
export async function getAllTwitterPosts(page = 1, limit = 20, forYouOnly = false) {
  if (!supabase) return { posts: [], total: 0 };
  try {
    const from = (page - 1) * limit;
    const to = page * limit - 1;
    let query = supabase
      .from(TWITTER_POSTS_TABLE)
      .select('*', { count: 'exact' })
      .neq('is_read', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (forYouOnly) {
      query = query.eq('is_for_you', true);
    }
    const { data, count, error } = await query;
    if (error) throw error;
    return { posts: data || [], total: count || 0 };
  } catch (err) {
    console.error('获取 Twitter 推文失败:', err.message);
    return { posts: [], total: 0 };
  }
}
```

**Step 2: Commit**
```bash
git add backend/src/db/supabase.js
git commit -m "feat: getAllTwitterPosts 支持 forYouOnly 过滤参数"
```

---

## Task 6: Backend — supabase.js: tweet_users CRUD

**Files:**
- Modify: `backend/src/db/supabase.js`

**Step 1: Add constant and CRUD functions at end of supabase.js (before `export default supabase`)**

Add after `markXueqiuPostRead` and before `export default supabase`:

```js
/**
 * Twitter 用户监控
 */
const TWEET_USERS_TABLE = 'tweet_users';

export async function getTweetUsers() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from(TWEET_USERS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('获取 tweet_users 失败:', err.message);
    return [];
  }
}

export async function saveTweetUser(user) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from(TWEET_USERS_TABLE)
      .upsert({
        user_id: user.user_id,
        screen_name: user.screen_name || '',
        profile_image_url: user.profile_image_url || '',
        description: user.description || ''
      }, { onConflict: 'user_id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('保存 tweet_users 失败:', err.message);
    return false;
  }
}

export async function deleteTweetUser(userId) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from(TWEET_USERS_TABLE)
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('删除 tweet_users 失败:', err.message);
    return false;
  }
}
```

**Step 2: Commit**
```bash
git add backend/src/db/supabase.js
git commit -m "feat: supabase.js 新增 tweet_users CRUD 函数"
```

---

## Task 7: Backend — xService.js: 新增 getUserTweets

**Files:**
- Modify: `backend/src/services/xService.js`
- Modify: `backend/src/config/settingsConfig.js`

**Step 1: Add `USER_TWEETS_QUERY_ID` to settingsConfig.js**

In `settingsConfig.js`, add to `DEFAULT_CONFIG`:
```js
const DEFAULT_CONFIG = {
  homeTimelineQueryId: process.env.HOME_TIMELINE_QUERY_ID || '',
  homeLatestTimelineQueryId: process.env.HOME_LATEST_TIMELINE_QUERY_ID || '',
  userTweetsQueryId: process.env.USER_TWEETS_QUERY_ID || '',  // ← add
  updatedAt: null
};
```

In `loadConfigFromDB()`, add to the `Promise.all`:
```js
const [homeQueryId, latestQueryId, userTweetsQueryId] = await Promise.all([
  getSetting('HOME_TIMELINE_QUERY_ID', process.env.HOME_TIMELINE_QUERY_ID || ''),
  getSetting('HOME_LATEST_TIMELINE_QUERY_ID', process.env.HOME_LATEST_TIMELINE_QUERY_ID || ''),
  getSetting('USER_TWEETS_QUERY_ID', process.env.USER_TWEETS_QUERY_ID || '')  // ← add
]);

currentConfig = {
  homeTimelineQueryId: homeQueryId || DEFAULT_CONFIG.homeTimelineQueryId,
  homeLatestTimelineQueryId: latestQueryId || DEFAULT_CONFIG.homeLatestTimelineQueryId,
  userTweetsQueryId: userTweetsQueryId || DEFAULT_CONFIG.userTweetsQueryId,  // ← add
  updatedAt: new Date().toISOString()
};
```

**Step 2: Add `getUserTweets` to xService.js**

In `xService.js`, update `getQueryId` to support 'user':
```js
function getQueryId(type) {
  const config = getConfig();
  if (type === 'home') return config.homeTimelineQueryId;
  if (type === 'user') return config.userTweetsQueryId;
  return config.homeLatestTimelineQueryId;
}
```

Then add `getUserTweets` export after `getFollowingTweets`:
```js
/**
 * 获取指定用户的推文
 * @param {string} userId - 用户的数字 ID（字符串形式）
 * @param {number} count - 获取数量
 * @returns {Promise<Array>}
 */
export async function getUserTweets(userId, count = 20) {
  if (!configLoaded) {
    await loadConfigFromDB();
    configLoaded = true;
  }

  const queryId = getQueryId('user');
  if (!queryId) {
    console.warn('USER_TWEETS_QUERY_ID 未配置，跳过用户 timeline 抓取');
    return [];
  }

  const url = `${X_API_BASE}/${queryId}/UserTweets`;
  const cookies = await getXCookies();

  const headers = {
    'authorization': `Bearer ${cookies.bearer_token}`,
    'x-csrf-token': cookies.ct0,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-client-language': 'en',
    'cookie': `auth_token=${cookies.auth_token}; ct0=${cookies.ct0}`,
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'referer': `https://x.com/`,
    'origin': 'https://x.com'
  };

  const variables = {
    userId,
    count,
    includePromotedContent: false,
    withQuotedTweets: true,
    withSuperFollowsUserFields: true
  };

  const features = {
    blue_business_profile_image_shape_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    tweetypie_unmention_optimization_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    responsive_web_media_download_video_enabled: false
  };

  try {
    const response = await axios.get(url, {
      headers,
      params: {
        variables: JSON.stringify(variables),
        features: JSON.stringify(features)
      }
    });
    return parseTweets(response.data);
  } catch (error) {
    console.error(`获取用户 ${userId} 推文失败:`, error.response?.data || error.message);
    return [];
  }
}
```

> **Note:** `USER_TWEETS_QUERY_ID` 的值从 X.com 网络流量中获取：在 X.com 上访问任意用户主页，抓取 Network → XHR → 找到 `UserTweets` 请求，复制路径中的 queryId 段。将该值存入 Supabase settings 表（key: `USER_TWEETS_QUERY_ID`）或 backend/.env。

**Step 3: Commit**
```bash
git add backend/src/config/settingsConfig.js backend/src/services/xService.js
git commit -m "feat: xService 新增 getUserTweets，settingsConfig 支持 USER_TWEETS_QUERY_ID"
```

---

## Task 8: Backend — 新建 twitterUserSync.js

**Files:**
- Create: `backend/src/services/twitterUserSync.js`

**Step 1: Create the file**

```js
import { getUserTweets } from './xService.js';
import { getTweetUsers, saveTwitterPosts } from '../db/supabase.js';

let syncInterval = null;

/**
 * 启动 Twitter 用户推文同步任务
 * @param {number} intervalMs - 同步间隔（毫秒），默认 5 分钟
 */
export function startTwitterUserSync(intervalMs = 300000) {
  if (syncInterval) {
    console.log('Twitter 用户同步任务已在运行中');
    return;
  }
  console.log(`启动 Twitter 用户同步任务，间隔 ${intervalMs / 1000} 秒`);
  syncTwitterUsers();
  syncInterval = setInterval(syncTwitterUsers, intervalMs);
}

/**
 * 停止 Twitter 用户推文同步任务
 */
export function stopTwitterUserSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Twitter 用户同步任务已停止');
  }
}

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

/**
 * 同步单个用户的推文
 */
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

/**
 * 手动触发一次同步
 */
export async function triggerTwitterUserSync() {
  await syncTwitterUsers();
  return { success: true, message: 'Twitter 用户同步已触发' };
}
```

**Step 2: Commit**
```bash
git add backend/src/services/twitterUserSync.js
git commit -m "feat: 新建 twitterUserSync.js，参考 xueqiuSync 架构"
```

---

## Task 9: Backend — twitter.js 新增 users 端点 + forYouOnly

**Files:**
- Modify: `backend/src/routes/twitter.js`

**Step 1: Update imports and GET /posts route**

At the top of `twitter.js`, update imports:
```js
import express from 'express';
import { getAllTwitterPosts, markTwitterPostRead, getTweetUsers, saveTweetUser, deleteTweetUser } from '../db/supabase.js';
import { triggerTwitterSync } from '../services/twitterSync.js';
import { triggerTwitterUserSync } from '../services/twitterUserSync.js';
```

Update `GET /posts` to support `forYouOnly`:
```js
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const forYouOnly = req.query.forYouOnly === 'true';
    const { posts, total } = await getAllTwitterPosts(page, limit, forYouOnly);
    res.json({
      success: true,
      data: { posts, total, page, hasMore: page * limit < total }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

**Step 2: Add user management routes (append before `export default router`)**

```js
/**
 * GET /api/twitter/users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await getTweetUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/twitter/users
 * Body: { user_id, screen_name, profile_image_url, description }
 */
router.post('/users', async (req, res) => {
  try {
    const { user_id, screen_name, profile_image_url, description } = req.body;
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }
    const ok = await saveTweetUser({ user_id: String(user_id), screen_name, profile_image_url, description });
    if (!ok) return res.status(500).json({ success: false, error: '保存失败' });
    // 后台触发一次同步
    triggerTwitterUserSync().catch(err => console.error('同步失败:', err.message));
    res.json({ success: true, message: '用户添加成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/twitter/users/:userId
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const ok = await deleteTweetUser(userId);
    if (!ok) return res.status(500).json({ success: false, error: '删除失败' });
    res.json({ success: true, message: '用户删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/twitter/users/sync
 * 手动触发 Twitter 用户同步
 */
router.post('/users/sync', async (req, res) => {
  try {
    const result = await triggerTwitterUserSync();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

**Step 3: Commit**
```bash
git add backend/src/routes/twitter.js
git commit -m "feat: twitter.js 新增用户管理端点，GET /posts 支持 forYouOnly 参数"
```

---

## Task 10: Backend — index.js 注册 twitterUserSync

**Files:**
- Modify: `backend/src/index.js`

**Step 1: Import and start the new sync**

Add import near the top (after existing imports):
```js
import { startTwitterUserSync } from './services/twitterUserSync.js';
```

Add after `startTwitterSync(300000)`:
```js
startTwitterUserSync(300000); // 每 5 分钟同步一次 Twitter 用户推文
```

**Step 2: Commit**
```bash
git add backend/src/index.js
git commit -m "feat: index.js 启动 twitterUserSync 定时任务"
```

---

## Task 11: Frontend — HomeView.vue: For You 开关 + 首页导航

**Files:**
- Modify: `frontend/src/views/HomeView.vue`

**Step 1: Add For You toggle to template header**

In `HomeView.vue` template, the header actions section currently is:
```html
<div class="header-actions">
  <router-link to="/user_settings" class="nav-link" title="用户管理">
    👥
  </router-link>
  <button class="settings-btn" @click="openSettings" title="设置">
    🔧
  </button>
  ...
</div>
```

Add the toggle before the 🔧 button:
```html
<div class="header-actions">
  <router-link to="/user_settings" class="nav-link" title="用户管理">
    👥
  </router-link>
  <label class="for-you-toggle" title="只看 For You 推文">
    <input type="checkbox" v-model="forYouOnly" @change="onForYouToggle" />
    <span>For You</span>
  </label>
  <button class="settings-btn" @click="openSettings" title="设置">
    🔧
  </button>
  ...
</div>
```

**Step 2: Add `forYouOnly` state and logic to `<script setup>`**

Add `forYouOnly` ref:
```js
const forYouOnly = ref(false)
```

Add `onForYouToggle` function:
```js
async function onForYouToggle() {
  try {
    await axios.post('/api/settings/for_you_only', { value: forYouOnly.value ? 'true' : 'false' })
    tweets.value = []
    pendingTweets.value = []
    await loadTweets()
  } catch (err) {
    console.error('保存 for_you_only 设置失败:', err)
  }
}
```

In `onMounted`, load the setting before starting the interval:
```js
onMounted(async () => {
  try {
    const res = await axios.get('/api/settings/for_you_only')
    forYouOnly.value = res.data?.data?.value === 'true'
  } catch {}
  loadTweets()
  refreshInterval = setInterval(loadTweets, 8000)
})
```

In `loadTweets`, pass `forYouOnly` to the Twitter request:
```js
const [twitterRes, xueqiuRes] = await Promise.all([
  axios.get('/api/twitter/posts', { params: { page: 1, limit: 30, forYouOnly: forYouOnly.value } }).catch(() => null),
  axios.get('/api/xueqiu/posts', { params: { page: 1, limit: 30 } }).catch(() => null)
])
```

**Step 3: Add toggle CSS to `<style scoped>`**
```css
.for-you-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #536471;
  cursor: pointer;
  user-select: none;
}

.for-you-toggle input[type="checkbox"] {
  accent-color: #1d9bf0;
  width: 14px;
  height: 14px;
  cursor: pointer;
}
```

**Step 4: Commit**
```bash
git add frontend/src/views/HomeView.vue
git commit -m "feat: 首页加 For You 开关，切换时写入 settings 并刷新 feed"
```

---

## Task 12: Frontend — UserSettingsView.vue: 新增 Twitter 用户监控区块

**Files:**
- Modify: `frontend/src/views/UserSettingsView.vue`

**Step 1: Add Twitter users section to template (after existing sync-section)**

Add before the closing `</div>` of `.content`:
```html
<!-- Twitter 用户监控 -->
<div class="add-section">
  <h3>🐦 Twitter 用户监控</h3>
  <div class="add-form">
    <input
      v-model="newTwitterUserId"
      type="text"
      placeholder="输入 Twitter 用户的数字 ID（如 44196397）..."
      @keyup.enter="addTwitterUser"
      class="user-input"
    />
    <button class="btn-add" @click="addTwitterUser" :disabled="!newTwitterUserId.trim()">
      ➕ 添加
    </button>
  </div>
  <p class="help-text">
    💡 在 X.com 上打开用户主页，通过第三方工具（如 <a href="https://tweeterid.com" target="_blank">tweeterid.com</a>）查询用户数字 ID
  </p>
</div>

<div class="table-section">
  <h3>Twitter 监控用户列表 ({{ twitterUserList.length }} 个)</h3>
  <div class="table-wrapper">
    <table class="user-table">
      <thead>
        <tr>
          <th>用户ID</th>
          <th>用户名</th>
          <th>Bio</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in twitterUserList" :key="user.user_id">
          <td class="user-id">{{ user.user_id }}</td>
          <td class="user-name">{{ user.screen_name || '-' }}</td>
          <td class="user-desc">{{ user.description || '-' }}</td>
          <td class="actions">
            <button class="btn-remove" @click="removeTwitterUser(user.user_id)">
              🗑️ 删除
            </button>
          </td>
        </tr>
        <tr v-if="twitterUserList.length === 0">
          <td colspan="4" class="empty">暂无监控用户</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<div class="sync-section">
  <div class="sync-info">
    <span class="status" :class="twitterSyncing ? 'syncing' : 'idle'">
      {{ twitterSyncing ? '🔄 同步中...' : '✓ 等待同步' }}
    </span>
    <span class="interval">每 5 分钟自动同步</span>
  </div>
  <button class="btn-sync" @click="triggerTwitterUserSync" :disabled="twitterSyncing">
    🔄 立即同步
  </button>
</div>
```

**Step 2: Add script logic for Twitter users**

In `<script setup>`, add new refs after existing ones:
```js
const twitterUserList = ref([])
const newTwitterUserId = ref('')
const twitterSyncing = ref(false)
```

Add to `onMounted`:
```js
onMounted(async () => {
  await loadUsers()
  await loadTwitterUsers()
})
```

Add functions:
```js
async function loadTwitterUsers() {
  try {
    const res = await axios.get(`${API_BASE}/twitter/users`)
    if (res.data.success) {
      twitterUserList.value = res.data.data || []
    }
  } catch (err) {
    console.log('加载 Twitter 用户失败:', err.message)
  }
}

async function addTwitterUser() {
  const id = newTwitterUserId.value.trim()
  if (!id) return
  if (twitterUserList.value.find(u => u.user_id === id)) {
    showMessage('⚠️ 用户已存在', 'error')
    return
  }
  try {
    await axios.post(`${API_BASE}/twitter/users`, { user_id: id })
    twitterUserList.value.push({ user_id: id, screen_name: '', description: '' })
    showMessage('✅ 添加成功，后台正在同步...', 'success')
    newTwitterUserId.value = ''
  } catch (err) {
    showMessage('❌ 添加失败: ' + err.message, 'error')
  }
}

async function removeTwitterUser(userId) {
  try {
    await axios.delete(`${API_BASE}/twitter/users/${userId}`)
    twitterUserList.value = twitterUserList.value.filter(u => u.user_id !== userId)
    showMessage('✅ 已删除', 'success')
  } catch (err) {
    showMessage('❌ 删除失败: ' + err.message, 'error')
  }
}

async function triggerTwitterUserSync() {
  twitterSyncing.value = true
  try {
    await axios.post(`${API_BASE}/twitter/users/sync`)
    showMessage('✅ 同步完成', 'success')
    await loadTwitterUsers()
  } catch (err) {
    showMessage('❌ 同步失败: ' + err.message, 'error')
  } finally {
    twitterSyncing.value = false
  }
}
```

**Step 3: Add `.user-desc` CSS (add to existing `<style scoped>`)**
```css
.user-table .user-desc {
  color: #536471;
  font-size: 13px;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**Step 4: Commit**
```bash
git add frontend/src/views/UserSettingsView.vue
git commit -m "feat: UserSettingsView 新增 Twitter 用户监控区块"
```

---

## Task 13: Deploy

**Step 1: Push backend to GitHub (triggers Render auto-deploy)**
```bash
git push origin main
```

**Step 2: Deploy frontend to Vercel**
```bash
cd frontend
vercel --prod
```

**Step 3: Verify in production**
- [ ] 首页 metrics 已消失
- [ ] ❄️ 链接已变成 👥，点击跳到 `/user_settings`
- [ ] `/user_settings` 页面正常，显示雪球用户管理 + Twitter 用户监控两个区块
- [ ] For You 开关：切换后 feed 刷新，状态持久化（刷新页面后保持）
- [ ] Twitter 用户管理：添加用户 ID → 出现在列表 → 后台同步触发
- [ ] 在 Supabase 中查询 `SELECT USER_TWEETS_QUERY_ID` setting，确认已配置

---

## 附：USER_TWEETS_QUERY_ID 获取方法

1. 登录 x.com，打开任意用户主页（如 `x.com/elonmusk`）
2. F12 → Network → XHR
3. 找到包含 `UserTweets` 的请求
4. 从 URL 中提取 queryId：`graphql/{QUERY_ID}/UserTweets`
5. 在 Supabase SQL Editor 运行：
   ```sql
   INSERT INTO settings (key, value, description)
   VALUES ('USER_TWEETS_QUERY_ID', '{your_query_id}', 'X UserTweets GraphQL Query ID')
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
   ```
