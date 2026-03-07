# 首页聚合雪球数据 + 来源感知链接按钮

## Context

当前首页 (`HomeView.vue`) 只展示 X.com 推文。用户希望将雪球网帖子也混入首页 feed，按时间倒排统一展示；帖子右上角的链接按钮根据来源跳转到不同网站（X.com 或 xueqiu.com）。刷新周期与 X 推文一致（每 15 秒）。

---

## 方案：前端合并

复用现有 `/api/xueqiu/posts` 接口，在 `HomeView.vue` 将两个数据源合并后渲染，无需新增后端代码。

---

## 变更范围

### 1. `frontend/src/views/HomeView.vue`

**新增 `normalizeXueqiuPost(post)` 辅助函数**，将雪球帖子格式化为 TweetCard 兼容结构：

```js
function normalizeXueqiuPost(post) {
  return {
    id: String(post.id),
    text: post.text,
    createdAt: post.created_at,
    source: 'xueqiu',
    userId: post.user_id,          // 用于拼 xueqiu.com 链接
    author: {
      name: post.user_screen_name,
      username: post.user_screen_name,
      avatar: post.avatar || '',
    },
    metrics: {
      replies: post.comments_count || 0,
      retweets: post.reposts_count || 0,
      likes: post.likes_count || 0,
    },
    media: [],
    entities: null,
    article: null,
  }
}
```

**修改 `loadTweets()`**，并行拉取两个接口，合并排序：

```js
const [tweetRes, xueqiuRes] = await Promise.all([
  fetchForYouTweets(20),
  axios.get('/api/xueqiu/posts', { params: { page: 1, limit: 30 } }).catch(() => null)
])

const xTweets = tweetRes.data
const xueqiuPosts = (xueqiuRes?.data?.data?.posts || []).map(normalizeXueqiuPost)
const allNew = [...xTweets, ...xueqiuPosts]
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
```

- 雪球接口失败时 `.catch(() => null)` 静默处理，不影响 X 推文正常显示
- 去重键必须包含来源，避免 Twitter 和雪球在相同 `id` 下互相覆盖：
```js
function getFeedItemKey(item) {
  return `${item.source}:${item.id}`
}

const existingIds = new Set(tweets.value.map(getFeedItemKey))
const newItems = allNew.filter(t => !existingIds.has(getFeedItemKey(t)))
```
- `pendingTweets` 和分页合并去重也要复用同一个 `getFeedItemKey()`
- 补充 `import axios from 'axios'`

---

### 2. `frontend/src/components/TweetCard.vue`

**修改 `openTweetLink()`**：

```js
function openTweetLink() {
  if (props.tweet.source === 'xueqiu') {
    window.open(`https://xueqiu.com/s/${props.tweet.userId}/${props.tweet.id}`, '_blank')
  } else {
    window.open(`https://x.com/i/web/status/${props.tweet.id}`, '_blank')
  }
}
```

**修改右上角按钮模板**，雪球帖子显示 ❄️，X 推文保留原 SVG：

```html
<button class="x-link-btn" @click.stop="openTweetLink"
  :title="tweet.source === 'xueqiu' ? '在雪球网打开' : '在 X.com 打开'">
  <span v-if="tweet.source === 'xueqiu'" class="xueqiu-icon">❄️</span>
  <svg v-else viewBox="0 0 24 24" fill="currentColor">...</svg>
</button>
```

原按钮是 `@click="openTweetLink"`（无 `.stop`），改为 `@click.stop` 避免触发三连击已读逻辑。

---

## 关键文件

| 文件 | 修改内容 |
|------|---------|
| `frontend/src/views/HomeView.vue` | 并行拉取 + 归一化 + 按 `source:id` 去重后合并排序 |
| `frontend/src/components/TweetCard.vue` | 来源感知链接按钮 |
| `frontend/src/api/auth.js` | 认证接口默认走相对路径 `/api/auth/*`，仅在配置 `VITE_API_BASE` 时拼接远端地址 |

**不需要修改**：后端、路由、XueqiuView

---

## 验证

1. 首页加载 → 雪球帖子与 X 推文混合出现，按时间倒排
2. 雪球帖子右上角显示 ❄️，点击 → 跳转 `xueqiu.com/s/...`
3. X 推文右上角仍显示 X SVG，点击 → 跳转 `x.com/i/web/status/...`
4. 15 秒自动刷新 → 两个来源都更新
5. 有新内容 → "Load N posts" 条照常出现
6. Twitter 和雪球即使出现相同 `id`，首页也不会互相覆盖
7. 生产环境未配置 `VITE_API_BASE` 时，认证请求仍应命中当前站点的 `/api/auth/*`
