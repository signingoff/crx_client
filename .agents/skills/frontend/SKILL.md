---
name: 前端功能
description: X For You 前端功能说明 - Vue 3 + Vite 技术栈，包含组件结构、API 封装和交互设计
---

# 前端功能

## 技术栈
- Vue 3 (Composition API) + Vue Router 4 + Vite + Axios

## 目录结构

```
frontend/src/
├── api/
│   ├── tweets.js          # Twitter API 封装（Query ID、已读标记）
│   └── xueqiu.js          # 雪球 API 封装
├── components/
│   ├── TweetCard.vue       # 推文/帖子卡片组件（三连击已读、Lightbox、RT嵌套）
│   ├── TweetList.vue       # 列表容器（已读状态自动同步）
│   ├── TwitterEmbed.vue    # Twitter 嵌入组件
│   └── QueryIdSettings.vue # Query ID 设置面板
├── views/
│   ├── HomeView.vue        # 首页（Twitter + 雪球混合流，8秒轮询）
│   └── UserSettingsView.vue # 用户管理（左右双栏：雪球 + Twitter）
├── router/index.js
├── App.vue
└── main.js
```

## 核心功能

### TweetCard.vue
- **Props**: `tweet` (Object), `isSelected` (Boolean), `isRead` (Boolean)
- **Emits**: `block-user`, `select-tweet`, `update:isRead`
- **三连击已读**: 500ms 内点击 3 次切换已读/未读，调用 `POST /api/tweets/mark-read`
- **RT 转发**: 检测 `RT @` 前缀，解析原始作者和内容，嵌套显示
- **长推文**: `isLongText` 标记，未展开时截断至 280 字符
- **图片网格**: 1张=全宽(contain)，2-4张=grid(cover)，点击打开 Lightbox
- **@链接**: `@username` 自动链接到 x.com，`event.stopPropagation()` 防冲突

### HomeView.vue
- 8秒轮询数据库，新推文进入 `pendingTweets`，点击 "Load X posts" 按钮加载
- Twitter Following + 雪球帖子混合流，按时间倒排
- 浏览器窗口滚动，Header `position: sticky`

### TweetList.vue
- 每5秒自动同步已读状态（`POST /api/tweets/read-status`）
- 单向同步：服务器已读 → 本地已读

## API 封装 (`frontend/src/api/tweets.js`)

| 函数 | 端点 | 说明 |
|------|------|------|
| `fetchForYouTweets(count)` | `GET /api/tweets/for-you` | 获取推文列表 |
| `markTweetsAsRendered(ids)` | `POST /api/tweets/mark-rendered` | 标记已加载 |
| `markTweetAsRead(id)` | `POST /api/tweets/mark-read` | 标记已读 |
| `markTweetAsUnread(id)` | `POST /api/tweets/mark-read` | 标记未读 |
| `fetchReadStatus(ids)` | `POST /api/tweets/read-status` | 批量查询已读状态 |

## 样式规范

| 用途 | 值 |
|------|------|
| 主色调 | `#1d9bf0` |
| 文字主色 | `#0f1419` |
| 文字次要 | `#536471` |
| 背景 | `#f7f9fa` |
| 已读标记 | `#00ba7c` |
| 字体 | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto` |

## 开发命令

```bash
cd frontend && npm run dev       # 开发模式 (端口 5173)
cd frontend && npm run build     # 构建生产包
cd frontend && vercel --prod     # 部署到 Vercel
```

## 部署地址

- 生产: https://frontend-eight-gilt-50.vercel.app
- 本地: http://localhost:5173
