# 雪球用户头像 join + 死代码清理

**日期**: 2026-03-04

## 背景

`xueqiu_posts` 表有一个 `avatar` 字段，在每次写帖子时从 API 响应冗余存储用户头像。
`xueqiu_users` 表已有 `profile_image_url` 字段，是更可靠的来源。
此外，存在若干从未被前端调用的后端路由，以及一处无效前端代码。

**目标**：
1. 停止向 `xueqiu_posts.avatar` 写入；读取时改从 `xueqiu_users.profile_image_url` join 获取
2. `syncSingleUser` 始终更新用户信息（含头像），不依赖"有新帖"条件
3. 删除所有死代码路由和无用代码

---

## 方案：DB 层 join（双查询合并）

不改 DB schema，在 `getAllXueqiuPosts()` 和 `getXueqiuPosts()` 里做两次 Supabase 查询，将 users 表的头像合并到帖子结果中，路由层零改动。

---

## 变更详情

### 1. `backend/src/db/supabase.js`

**新增私有 `normalizeAvatar(url)`**（替代路由层的重复实现）：
```js
function normalizeAvatar(url) {
  if (!url) return ''
  const firstUrl = url.split(',')[0]
  return firstUrl.startsWith('http')
    ? firstUrl
    : 'https://xavatar.imedao.com/' + firstUrl + '!240x240.jpg'
}
```

**`saveXueqiuPosts()`** — 删除 `avatar` 字段：
```js
// 删除：avatar: post.user?.profile_image_url || ''
```

**`getAllXueqiuPosts()`** — 查询后 join users 头像：
```js
const userIds = [...new Set(data.map(p => p.user_id))]
const { data: users } = await supabase.from('xueqiu_users')
  .select('user_id, profile_image_url').in('user_id', userIds)
const userMap = Object.fromEntries(
  (users || []).map(u => [u.user_id, normalizeAvatar(u.profile_image_url)])
)
return { posts: data.map(p => ({ ...p, avatar: userMap[p.user_id] || '' })), total: count }
```

**`getXueqiuPosts()`** — 单用户版，查该用户头像后合并：
```js
const { data: userRow } = await supabase.from('xueqiu_users')
  .select('profile_image_url').eq('user_id', userId).single()
const avatar = normalizeAvatar(userRow?.profile_image_url)
return (data || []).map(p => ({ ...p, avatar }))
```

---

### 2. `backend/src/services/xueqiuSync.js`

**`syncSingleUser()`** — 在 for 循环前声明 `apiUserInfo = null`，第一页时赋值，循环结束后**无条件**调用 `saveXueqiuUser`：

```js
let apiUserInfo = null

for (let page = 1; ...) {
  // ...
  if (page === 1 && statuses.length > 0) {
    apiUserInfo = statuses[0]?.user
  }
  // ...
}

// 始终更新用户信息（含 profile_image_url）
if (apiUserInfo) {
  const userScreenName = (apiUserInfo.screen_name || targetUserId)
    .replace(/\s*[-–]\s*雪球$/, '').trim()
  await saveXueqiuUser({
    id: apiUserInfo.id || parseInt(targetUserId),
    user_id: parseInt(targetUserId),
    screen_name: userScreenName,
    profile_image_url: apiUserInfo.profile_image_url,
    description: apiUserInfo.description,
    followers_count: apiUserInfo.followers_count,
    friends_count: apiUserInfo.friends_count,
    statuses_count: apiUserInfo.statuses_count
  })
}

if (newPosts.length > 0) {
  await saveXueqiuPosts(newPosts, parseInt(targetUserId), ...)
}
```

---

### 3. `backend/src/routes/xueqiu.js`

**删除 5 个死代码路由**：
- `GET /user/:userId`（实时拉 API timeline）
- `GET /user/:userId/all`
- `GET /user/:userId/info`
- `GET /init`
- `GET /user-detail/:userId`

**`GET /saved/:userId`** — 简化（DB 层已 join，无需额外查 user）：
```js
const posts = await getXueqiuPosts(parseInt(userId), 500)
res.json({ success: true, data: posts })
```

**`GET /posts`** — 简化（删除 `normalizeAvatar` 函数和 `normalizedPosts` 映射）：
```js
const { posts, total } = await getAllXueqiuPosts(page, limit)
res.json({ success: true, data: { posts, total, page, hasMore: page * limit < total } })
```

**精简 import**，删除不再使用的：`xueqiuService`（整个 import 行）、`ensureXueqiuPostsTable`、`getXueqiuUser`。

---

### 4. `frontend/src/views/XueqiuSettingsView.vue`

删除无用的空定时器及相关代码：
```js
// 删除：
let syncTimer = null
syncTimer = setInterval(() => {}, 5000)
if (syncTimer) clearInterval(syncTimer)
```

---

## 关键文件

| 文件 | 改动 |
|------|------|
| `backend/src/db/supabase.js` | 去除 avatar 写入；新增 normalizeAvatar；两个查询函数 join users |
| `backend/src/services/xueqiuSync.js` | 始终保存用户信息 |
| `backend/src/routes/xueqiu.js` | 删除 5 个路由；简化 2 个路由；精简 import |
| `frontend/src/views/XueqiuSettingsView.vue` | 删除空定时器 |

**不动的文件**：XueqiuView、XueqiuUserView（接口返回的 `avatar` 字段保持不变，兼容）

---

## 验证

1. `POST /api/xueqiu/users` 添加新用户 → 触发 sync → `/api/xueqiu/users` 返回该用户有 `profile_image_url`
2. `/xueqiu` 页面帖子列表 → 头像正常显示
3. 点击某用户头像进入 `/xueqiu/user/:id` → 帖子头像正常显示
4. `/xueqiu/settings` 页面加载正常，添加/删除用户正常
5. 后端日志无报错，已删除路由访问返回 404
