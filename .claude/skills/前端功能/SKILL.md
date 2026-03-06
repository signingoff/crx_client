---
name: 前端功能
description: X For You 前端功能说明 - Vue 3 + Vite 技术栈
---

# 前端功能

## 技术栈
- Vue 3 (Composition API)
- Vue Router 4
- Vite
- Axios

## 目录结构

```
frontend/
├── src/
│   ├── api/
│   │   └── tweets.js          # API 请求封装
│   ├── components/
│   │   ├── TweetCard.vue      # 单条推文卡片组件
│   │   ├── TweetList.vue      # 推文列表容器
│   │   ├── Twittered.vue   # Twitter 嵌入组件
│   │   └── QueryIdSettings.vue # Query ID 设置面板
│   ├── views/
│   │   ├── HomeView.vue       # 主页面视图

│   ├── router/
│   │   └── index.js           # 路由配置
│   ├── App.vue                # 根组件
│   └── main.js                # 入口文件
├── index.html
├── package.json
└── vite.config.js
```

## 核心功能

### 1. 推文展示

#### TweetCard.vue 组件详解

**文件**: `frontend/src/components/TweetCard.vue`

##### Props
| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| tweet | Object | 是 | 推文数据对象 |
| isSelected | Boolean | 否 | 是否被选中 |
| isRead | Boolean | 否 | 是否已读（从父组件传入，用于自动同步） |

##### Emits
| Event | 参数 | 说明 |
|-------|------|------|
| block-user | username | 屏蔽用户事件 |
| select-tweet | tweetId | 选择推文事件 |
| update:isRead | isRead | 已读状态变更 |

##### 数据结构
```javascript
// tweet 对象结构
{
  id: '123456789',
  text: '推文内容',
  isLongText: false,
  createdAt: '2026-01-15T10:30:00.000Z',
  author: {
    id: '987654321',
    name: 'User Name',
    username: 'username',
    avatar: 'https://pbs.twimg.com/...',
    description: '个人简介',
    location: 'Hong Kong',
    createdAt: '2015-08-01T00:00:00.000Z',
    followingCount: 41,
    followersCount: 2989
  },
  metrics: {
    replies: 10,
    retweets: 5,
    likes: 100,
    views: 1000
  },
  media: [
    { type: 'photo', url: 'https://pbs.twimg.com/...' }
  ],
  entities: { ... }
}
```

##### 功能特性

**1. 作者信息展示**
- 头像（48px 圆形）
- 显示名称（加粗）
- 用户名（@xxx，灰色）
- 发布时间（相对时间）

**2. 用户详细信息**
显示在作者名称下方：
- **description**: 个人简介（可能包含 Telegram 等联系方式）
- **location**: 位置信息（📍 图标前缀）
- **followingCount**: 关注数
- **followersCount**: 粉丝数
- **createdAt**: 注册时间（格式：Joined Month Year）

示例：
```
📍 Hong Kong
41 Following  2,989 Followers  Joined August 2015
```

**3. 推文内容处理**

```javascript
// formatText 函数 - 高亮话题标签、@用户名和URL链接
function formatText(text) {
  if (!text) return ''
  return text
    .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
    .replace(/@(\w+)/g, '<a href="https://x.com/$1" target="_blank" class="mention-link" onclick="event.stopPropagation()">@$1</a>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="url-link" onclick="event.stopPropagation()">$1</a>')
    .replace(/\n/g, '<br>')
}
```

**4. 三连击切换已读/未读**

```javascript
const TRIPLE_CLICK_DELAY = 500 // 500ms 内完成3次点击

async function handleTripleClick() {
  clickCount.value++

  // 第一次点击启动定时器
  if (!clickTimer) {
    clickTimer = setTimeout(() => {
      clickCount.value = 0
      clickTimer = null
    }, TRIPLE_CLICK_DELAY)
  }

  // 达到3次点击
  if (clickCount.value >= 3) {
    clearTimeout(clickTimer)
    clickTimer = null
    clickCount.value = 0

    const newReadState = !isRead.value
    isRead.value = newReadState

    try {
      if (newReadState) {
        await markTweetAsRead(props.tweet.id)
      } else {
        await markTweetAsUnread(props.tweet.id)
      }
    } catch (err) {
      console.error('标记已读/未读失败:', err)
      isRead.value = !newReadState
    }
  }
}
```

**5. RT（转发）嵌套显示**

```javascript
// 判断是否为转发
const isRetweet = computed(() => {
  return props.tweet.text?.startsWith('RT @')
})

// 解析转发内容
const parsedRetweet = computed(() => {
  if (!isRetweet.value) return null
  const text = props.tweet.text
  const match = text.match(/^RT @([^:]+): (.+)$/s)
  if (match) {
    return {
      originalUsername: match[1],
      originalText: match[2]
    }
  }
  return null
})

// 显示的作者
const displayAuthor = computed(() => {
  if (!isRetweet.value) {
    return props.tweet.author
  }
  // 转发推文处理...
})
```

**6. 长推文处理**

```javascript
// 显示的文本
const displayText = computed(() => {
  let text = props.tweet.text || ''

  if (isRetweet.value && parsedRetweet.value) {
    text = parsedRetweet.value.originalText
  }

  // 长推文未展开时截断
  if (props.tweet.isLongText && !isExpanded.value) {
    return text.slice(0, 280) + '...'
  }
  return text
})
```

**7. 媒体图片处理**

```javascript
// 只获取图片类型的媒体
const photoMedia = computed(() => {
  return props.tweet.media?.filter(m => m.type === 'photo') || []
})

// 获取缩略图 URL
function getThumbnailUrl(url) {
  if (!url) return ''
  if (url.includes('pbs.twimg.com')) {
    if (url.includes('?')) {
      return url + '&name=small'
    }
    return url + '?name=small'
  }
  return url
}
```

**8. Lightbox 图片放大**

```javascript
const lightboxOpen = ref(false)
const lightboxImage = ref(null)

function openLightbox(media) {
  lightboxImage.value = media
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden' // 禁止背景滚动
}

function closeLightbox() {
  lightboxOpen.value = false
  lightboxImage.value = null
  document.body.style.overflow = '' // 恢复滚动
}
```

### 2. 媒体处理

#### 图片网格布局

| 图片数量 | 布局方式 |
|---------|---------|
| 1张 | 全宽展示，保持原始比例，最大高度 500px |
| 2张 | 等分两列，grid-template-columns: repeat(2, 1fr) |
| 3张 | 首图跨两列，下面两张并排 |
| 4张 | 2x2 标准网格 |

```css
.tweet-media {
  display: grid;
  gap: 4px;
  border-radius: 12px;
  overflow: hidden;
}

/* 单张图片 - 保持原始比例 */
.tweet-media.single {
  grid-template-columns: 1fr;
}

.tweet-media.single .media-item {
  aspect-ratio: auto;
  max-height: 500px;
}

.tweet-media.single .media-item img {
  object-fit: contain;
  object-position: center;
}

/* 多张图片网格布局 */
.tweet-media.multiple {
  grid-template-columns: repeat(2, 1fr);
}

.tweet-media.multiple .media-item {
  aspect-ratio: 1;
}

.tweet-media.multiple .media-item img {
  object-fit: cover;
}
```

**关键点**:
- 单张图片使用 `object-fit: contain` 保持完整显示，不会被裁剪
- 多张图片使用 `object-fit: cover` 填充正方形区域
- 单张图片限制 `max-height: 500px` 避免过高

### 3. 主页面布局

#### HomeView.vue 详解

**文件**: `frontend/src/views/HomeView.vue`

##### 响应式数据

```javascript
const tweets = ref([])           // 已显示的推文列表
const pendingTweets = ref([])    // 待加载的新推文
const loading = ref(false)       // 加载状态
const error = ref('')            // 错误信息
const lastUpdated = ref('')      // 最后更新时间
let refreshInterval = null       // 自动刷新定时器
```

##### 核心方法

**加载推文**
```javascript
async function loadTweets() {
  if (tweets.value.length === 0) {
    loading.value = true
  }
  error.value = ''

  try {
    const response = await fetchForYouTweets(20)
    if (response.success) {
      const existingIds = new Set(tweets.value.map(t => t.id))
      const newTweets = response.data.filter(t => !existingIds.has(t.id))

      if (tweets.value.length === 0) {
        // 初始加载
        tweets.value = response.data
        updateLastUpdatedTime()
      } else if (newTweets.length > 0) {
        // 有新推文，加入待加载列表
        const pendingIds = new Set(pendingTweets.value.map(t => t.id))
        const trulyNew = newTweets.filter(t => !pendingIds.has(t.id))
        if (trulyNew.length > 0) {
          pendingTweets.value = [...trulyNew, ...pendingTweets.value]
        }
      }
    }
  } catch (err) {
    error.value = err.message || '网络错误'
  } finally {
    loading.value = false
  }
}
```

**加载待显示推文**
```javascript
async function loadPendingTweets() {
  const loadedTweets = [...pendingTweets.value]
  tweets.value = [...loadedTweets, ...tweets.value]
  pendingTweets.value = []
  updateLastUpdatedTime()

  // 滚动到顶部（浏览器窗口）
  window.scrollTo({ top: 0, behavior: 'smooth' })

  // 标记为已加载
  const tweetIds = loadedTweets.map(t => t.id)
  await markTweetsAsRendered(tweetIds)
}
```

**滚动分页加载更多**
```javascript
// 分页相关状态
const currentPage = ref(1)
const hasMoreData = ref(true)
const pageSize = 30

// 滚动监听处理
function handleScroll() {
  const scrollHeight = document.documentElement.scrollHeight
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const clientHeight = document.documentElement.clientHeight

  // 距离底部 200px 时触发加载
  if (scrollTop + clientHeight >= scrollHeight - 200) {
    loadMoreTweets()
  }
}

// 加载更多历史推文
async function loadMoreTweets() {
  if (loadingMore.value || !hasMoreData.value) return

  loadingMore.value = true
  currentPage.value++

  try {
    const [twitterRes, xueqiuRes] = await Promise.all([
      axios.get('/api/twitter/posts', { params: { page: currentPage.value, limit: pageSize } }),
      axios.get('/api/xueqiu/posts', { params: { page: currentPage.value, limit: pageSize } })
    ])

    const newPosts = [...twitterPosts, ...xueqiuPosts]

    // 检查是否还有更多数据
    hasMoreData.value = twitterCount >= pageSize || xueqiuCount >= pageSize

    if (newPosts.length > 0) {
      // 合并新旧数据，去重，按时间排序
      const combined = [...tweets.value, ...newPosts]
      const unique = combined.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      )
      tweets.value = unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else {
      hasMoreData.value = false
    }
  } finally {
    loadingMore.value = false
  }
}

// 生命周期中添加滚动监听
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
```

##### 生命周期钩子

```javascript
onMounted(() => {
  loadTweets()
  refreshInterval = setInterval(loadTweets, 15000) // 15秒刷新
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
```

### 4. 浏览器窗口滚动

**关键修改**（区别于 div 内滚动）：

```css
/* App.vue - 全局样式 */
html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: #f7f9fa;
}

#app {
  min-height: 100vh;
}

/* 浏览器窗口滚动条 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f7f9fa;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
```

```css
/* HomeView.vue - Header 固定 */
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
}
```

### 5. API 封装

**文件**: `frontend/src/api/tweets.js`

```javascript
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'

/**
 * 获取 For You 页面的推文
 * @param {number} count - 获取数量
 */
export async function fetchForYouTweets(count = 20) {
  const response = await axios.get(`${API_BASE}/tweets/for-you`, {
    params: { count, t: Date.now() }
  })
  return response.data
}

/**
 * 标记推文为已加载（过滤新推文用）
 * @param {string[]} tweetIds - 推文ID数组
 */
export async function markTweetsAsRendered(tweetIds) {
  if (!tweetIds || tweetIds.length === 0) return
  const response = await axios.post(`${API_BASE}/tweets/mark-rendered`, {
    tweetIds
  })
  return response.data
}

/**
 * 标记单条推文为已读
 * @param {string} tweetId - 推文ID
 */
export async function markTweetAsRead(tweetId) {
  if (!tweetId) return
  const response = await axios.post(`${API_BASE}/tweets/mark-read`, {
    tweetId,
    isRead: true
  })
  return response.data
}

/**
 * 标记单条推文为未读
 * @param {string} tweetId - 推文ID
 */
export async function markTweetAsUnread(tweetId) {
  if (!tweetId) return
  const response = await axios.post(`${API_BASE}/tweets/mark-read`, {
    tweetId,
    isRead: false
  })
  return response.data
}

/**
 * 获取已读统计
 */
export async function getReadStats() {
  const response = await axios.get(`${API_BASE}/tweets/read-stats`)
  return response.data
}

/**
 * 批量查询推文的已读状态（用于自动同步）
 * @param {string[]} tweetIds - 推文ID数组
 */
export async function fetchReadStatus(tweetIds) {
  if (!tweetIds || tweetIds.length === 0) return {}
  const response = await axios.post(`${API_BASE}/tweets/read-status`, {
    tweetIds
  })
  return response.data
}

/**
 * 获取已渲染推文数量
 */
export async function getRenderedCount() {
  const response = await axios.get(`${API_BASE}/tweets/rendered-count`)
  return response.data
}
```

### 6. 工具函数

#### 时间格式化

```javascript
function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN')
}

function formatJoinDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
```

#### 数字格式化

```javascript
function formatNumber(num) {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
```

## 交互功能

### 三连击标记已读

- **触发**: 连续单击 TweetCard.vue 卡片 3 次（500ms 内）
- **效果**: 标记推文为已读，卡片从列表中消失
- **API**: 调用 `POST /api/tweets/mark-read` (isRead: true)
- **数据库**: 更新 `read_posts.is_read = 1`
- **过滤逻辑**: 后端只返回未读推文（is_read = 0），已读推文不再显示

### X.com 跳转

- **触发**: 点击卡片右上角的 X 图标
- **行为**: 新标签页打开 `https://x.com/i/web/status/{tweetId}`

### @用户名链接

- 推文内容中的 `@username` 自动转换为可点击链接
- 点击跳转到 `https://x.com/username`
- 点击时阻止事件冒泡，避免触发三连击

### 图片 Lightbox

- 点击图片打开放大查看
- 背景变黑，图片居中显示
- 点击背景或关闭按钮退出

## 样式规范

### 颜色变量

| 用途 | 颜色值 |
|------|--------|
| 主色调（X蓝） | `#1d9bf0` |
| 文字主色 | `#0f1419` |
| 文字次要 | `#536471` |
| 边框 | `#e1e8ed` |
| 背景 | `#f7f9fa` |
| 已读标记绿 | `#00ba7c` |

### 字体规范

- 基础字体: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- 作者名称: 15px, font-weight: 700
- 用户名: 14px, color: #536471
- 推文内容: 15px, line-height: 1.5
- 互动指标: 13px, color: #536471

### 间距规范

- 卡片内边距: 16px
- 卡片间距: 12px
- 头像与信息间距: 12px
- 作者信息行间距: 4px

## 常见问题

### 1. 点击 @链接时触发三连击
**解决**: 使用 `onclick="event.stopPropagation()"` 阻止事件冒泡

### 2. 图片缩略图不显示
**检查**:
- URL 是否正确拼接 `?name=small` 或 `&name=small`
- 是否使用 `pbs.twimg.com` 域名

### 3. 单张图片显示不完整（被裁剪）
**问题**: 使用 `aspect-ratio: 1` 强制正方形导致图片被裁剪
**解决**: 单张图片使用 `object-fit: contain` 保持原始比例，多张图片使用 `object-fit: cover`
```css
/* 单张图片 - 保持原始比例 */
.tweet-media.single .media-item {
  aspect-ratio: auto;
  max-height: 500px;
}

.tweet-media.single .media-item img {
  object-fit: contain;
}

/* 多张图片 - 填充正方形 */
.tweet-media.multiple .media-item {
  aspect-ratio: 1;
}

.tweet-media.multiple .media-item img {
  object-fit: cover;
}
```

### 8. Twitter 嵌入组件

**文件**: `frontend/src/components/TwitterEmbed.vue`

使用 Twitter 官方嵌入脚本显示单条推文。

#### Props
| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| tweetId | String | 是 | 推文 ID |
| options | Object | 否 | 配置选项 |

#### Options 配置
```javascript
{
  theme: 'light',        // 'light' 或 'dark'
  cards: 'visible',      // 'visible' 或 'hidden'
  conversation: 'none',  // 'none' 或 'all'
  align: 'center',       // 'left', 'center', 'right'
  width: '100%'
}
```

 

### 10. 重启与部署流程

**重启时需要同时执行：**

1. **提交代码**
   ```bash
   git add -A
   git commit -m "描述更改"
   git push origin main    # 触发 Render 后端自动部署
   ```

2. **部署前端到 Vercel**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **本地重启服务**
   ```bash
   # Windows 清理端口
   taskkill -F -IM node.exe

   # 启动后端 (端口 3000)
   cd backend && npm run dev

   # 启动前端 (端口 5173)
   cd frontend && npm run dev
   ```

**部署地址：**
- 生产环境: https://frontend-eight-gilt-50.vercel.app
- 本地开发: http://localhost:5173

### 11. 已读状态自动同步

**文件**: `frontend/src/components/TweetList.vue`

**功能**: 每5秒自动查询服务器已读状态，更新本地卡片显示（解决多客户端/多标签页同步问题）

**实现原理**:
```javascript
// 1. 组件挂载时启动定时器
onMounted(() => {
  syncInterval = setInterval(syncReadStatus, 5000)
})

// 2. 批量查询已读状态
async function syncReadStatus() {
  const tweetIds = localTweets.value.map(t => t.id)
  const response = await fetchReadStatus(tweetIds) // POST /api/tweets/read-status

  // 3. 更新本地状态（服务器已读但本地未读时）
  const updatedTweets = localTweets.value.map(tweet => {
    if (readStatusMap[tweet.id] && !tweet.isRead) {
      return { ...tweet, isRead: true }
    }
    return tweet
  })
}
```

**关键代码**:
```vue
<TweetCard
  v-for="tweet in localTweets"
  :key="tweet.id"
  :tweet="tweet"
  :is-selected="tweet.id === selectedId"
  :is-read="tweet.isRead"  <!-- 传递 isRead 状态 -->
/>
```

**注意**:
- 同步是单向的：服务器已读 → 本地已读（不会反向覆盖）
- 避免与三连击冲突：用户本地操作优先，同步只补充更新

### 3. 滚动条样式不生效
**注意**: 滚动条样式现在定义在 `App.vue` 全局，而不是 `.content` 上

### 4. 三连击判定不准确
**调整**: 可以修改 `TRIPLE_CLICK_DELAY` 值（默认 500ms）

## 开发调试

### 启动开发模式

```bash
cd frontend
npm run dev
```

启动日志会自动写入 `frontend/frontend.log` 文件。

**实时查看日志：**
```bash
# Windows
tail -f frontend\frontend.log

# Linux/Mac
tail -f frontend/frontend.log
```

### 查看 API 请求
浏览器 Network 面板过滤 `localhost:3000`

### 检查后端数据
浏览器 Console 查看 `console.log('API response:', response)`
