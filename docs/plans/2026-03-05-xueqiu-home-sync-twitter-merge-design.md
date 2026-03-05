# 雪球首页同步 + Twitter 同步文件合并 设计文档

## 需求

1. **雪球首页 feed 同步**：同步用户在雪球上关注的人的首页帖子（类似 Twitter Following timeline），存入现有 `xueqiu_posts` 表。
2. **Twitter 同步文件合并**：`twitterSync.js` 和 `twitterUserSync.js` 合并为一个文件，统一 2 分钟间隔。

---

## 设计决策

| 决策点 | 选择 | 原因 |
|--------|------|------|
| 雪球首页帖子存储位置 | 现有 `xueqiu_posts` 表 | 无需新表，前端统一展示 |
| 雪球首页同步代码位置 | 加到现有 `xueqiuSync.js` | 避免新增文件，改动最小 |
| Twitter 合并后间隔 | 统一 2 分钟 | following + user 同步都用同一个 interval |
| `/xueqiu/saved` 路由 | 无需改动 | 已在上次重构中删除，当前路由已是 `/posts` |

---

## 变更详情

### 1. `backend/src/services/xueqiuService.js`

新增 `getHomeTimeline(count = 20)` 函数：

```js
export async function getHomeTimeline(count = 20) {
  const cookie = await getCookie();
  const response = await axios.get(
    `https://xueqiu.com/v2/statuses/home_timeline.json?count=${count}`,
    {
      headers: {
        'Cookie': `xq_a_token=${cookie}`,
        'User-Agent': 'Mozilla/5.0 ...',
        'Referer': 'https://xueqiu.com/'
      },
      timeout: 30000
    }
  );
  return response.data;
}
```

复用现有 `parseTimelineResponse` 解析返回数据。

### 2. `backend/src/services/xueqiuSync.js`

新增 `syncHomeTimeline()` 函数，在 `syncXueqiuPosts()` 末尾调用：

```js
async function syncHomeTimeline() {
  const result = await xueqiuService.getHomeTimeline(20);
  const parsed = xueqiuService.parseTimelineResponse(result);
  // 每条帖子用真实作者 user_id，source = 'home'
  await saveXueqiuHomePosts(parsed.statuses);
}
```

`saveXueqiuHomePosts` 将 `source` 字段设为 `'home'`，现有监控用户帖子 `source` 为 `null`（不破坏兼容）。

### 3. `backend/src/db/supabase.js`

新增 `saveXueqiuHomePosts(statuses)` 函数（或在 `saveXueqiuPosts` 中增加 `source` 参数），upsert 到 `xueqiu_posts`，字段：
- `id`：帖子 ID（upsert 主键）
- `user_id`：真实作者 ID
- `user_screen_name`：真实作者昵称
- `text`、`created_at`、互动数等：同现有字段
- `source = 'home'`

### 4. `backend/src/services/twitterSync.js`（合并后）

将 `twitterUserSync.js` 的全部逻辑合并进来：

- 单个 `syncInterval`，每 2 分钟执行一次 `syncAll()`
- `syncAll()` 依次调用：
  1. `syncFollowingTimeline()`（原 twitterSync 的 following 同步）
  2. `syncTwitterUsers()`（原 twitterUserSync 的用户监控同步）
- 导出保持兼容：`startTwitterSync`, `stopTwitterSync`, `triggerTwitterSync`, `triggerTwitterUserSync`

### 5. `backend/src/services/twitterUserSync.js`

**删除。**

### 6. `backend/src/index.js`

```js
// 删除
import { startTwitterUserSync } from './services/twitterUserSync.js';
startTwitterUserSync(120000);

// 保留（间隔已在 twitterSync 内部固定为 120000）
startTwitterSync(120000);
```

### 7. `backend/src/routes/twitter.js`

```js
// 修改 import 来源
import { triggerTwitterUserSync } from '../services/twitterSync.js';
// （原来是 twitterUserSync.js）
```

---

## 数据流

```
每 5 分钟（xueqiuSync）
  └─ syncXueqiuPosts()
       ├─ 遍历 xueqiu_users → syncSingleUser()  → xueqiu_posts (source=null)
       └─ syncHomeTimeline()                     → xueqiu_posts (source='home')

每 2 分钟（twitterSync 合并后）
  └─ syncAll()
       ├─ syncFollowingTimeline()  → twitter_posts
       └─ syncTwitterUsers()       → twitter_posts
```

---

## 不变的内容

- 前端 `HomeView.vue` 不需要修改（已调用 `/api/xueqiu/posts`）
- `xueqiu_posts` 表结构不变（`source` 字段已存在）
- 所有已有 API 路由路径不变
