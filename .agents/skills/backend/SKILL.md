---
name: 后端功能
description: X For You 后端功能说明 - Node.js + Express + SQLite/Supabase 技术栈
---

# 后端功能

## 技术栈
- Node.js 18+ / Express 4.x / Axios / better-sqlite3 (开发) / Supabase (生产)

## 目录结构

```
backend/src/
├── config/
│   └── settingsConfig.js  # Query ID 和 Cookie 配置
├── db/
│   ├── sqlite.js          # SQLite 数据库（开发环境）
│   ├── supabase.js        # Supabase 客户端（生产环境）
│   └── index.js           # 自动切换数据库
├── routes/
│   ├── twitterQueryConfig.js  # Query ID 配置路由
│   ├── twitter.js            # Twitter API 路由
│   └── xueqiu.js             # 雪球 API 路由
├── services/
│   ├── xService.js        # X API 调用（GraphQL）
│   ├── twitterSync.js     # Twitter Following + 监控用户同步（2分钟间隔）
│   ├── xueqiuService.js   # 雪球 API 服务
│   └── xueqiuSync.js      # 雪球同步服务（5分钟间隔）
└── index.js               # Express 入口
```

## 环境变量 (`backend/.env`)

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
X_AUTH_TOKEN=<auth_token cookie>
X_CT0=<ct0 cookie>
X_BEARER_TOKEN=<Bearer token, 去掉前缀>
SUPABASE_URL=<可选>
SUPABASE_SERVICE_KEY=<可选>
XUEQIU_COOKIE=<xq_a_token>
```

## 核心 API

### Twitter 路由 (`/api/tweets/*`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/for-you` | 获取推文列表（已过滤日/韩语、已读） |
| POST | `/mark-read` | 标记已读/未读 |
| POST | `/read-status` | 批量查询已读状态 |
| GET | `/read-stats` | 已读统计 |
| GET/POST | `/queryid-config` | Query ID 管理 |

### 雪球路由 (`/api/xueqiu/*`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/posts` | 获取帖子列表 |
| POST | `/posts/:id/read` | 标记已读/未读 |
| GET | `/sync` | 手动触发同步 |
| GET/POST/DELETE | `/users` | 用户管理 |

## X API 调用 (`xService.js`)

- **GraphQL 端点**: `https://x.com/i/api/graphql/{QueryID}/{Operation}`
- **Operations**: `HomeLatestTimeline`, `UserTweets`, `UserByScreenName`
- **认证**: Cookie (`auth_token` + `ct0`) + Bearer Token
- **过滤**: 日语/韩语推文自动过滤，已读推文不返回

## 数据库

### 自动切换
检测 `SUPABASE_URL` 环境变量，有则用 Supabase，否则用 SQLite。

### 主要表

| 表 | 说明 |
|------|------|
| `read_posts` | 推文已读状态（tweet_id, is_read） |
| `twitter_posts` | Twitter 推文存储 |
| `xueqiu_posts` | 雪球帖子存储 |
| `xueqiu_users` | 雪球监控用户 |
| `settings` | 配置项（Query ID、Cookie 等） |

## 错误处理格式

```javascript
// 成功: { success: true, data: {...} }
// 失败: { success: false, error: '错误信息' }
```

## 开发命令

```bash
cd backend && npm run dev    # 开发模式 (端口 3000)
cd backend && npm start      # 生产模式
cd backend && npm run test   # 运行测试
```

## 部署

- 生产: https://x-for-you-backend.onrender.com (Render, git push 自动部署)
- 本地: http://localhost:3000
