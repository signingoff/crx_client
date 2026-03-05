# X For You 项目记忆

## 部署信息
- 前端: https://frontend-eight-gilt-50.vercel.app（Vercel）
- 后端: https://x-for-you-backend.onrender.com（Render，push main 自动触发）
- 数据库: Supabase

## 部署命令
```bash
git add <files> && git commit -m "..." && git push origin main  # 触发 Render
cd frontend && vercel --prod                                    # 部署 Vercel
```

## 后端启动方式

### 开发模式（日志路径）
- **后端日志**: `D:\xueqiu_crx\backend\backend.log`
- **前端**: 不记录日志

```bash
# 启动后端（日志写入 backend/backend.log）
cd /d/xueqiu_crx/backend && npm run dev > backend.log 2>&1 &

# 启动前端（无日志文件）
cd /d/xueqiu_crx/frontend && npm run dev
```

### 查看日志
```bash
# 实时跟踪
tail -f backend.log

# 查看最新 50 行
tail -50 backend.log

# 清空日志
> backend.log
```

### 停止后端
```bash
# 杀掉所有 node 进程
taskkill //F //IM node.exe

# 或按端口查找
netstat -ano | grep :3000
taskkill //F //PID <PID>
```

## 架构现状（2026-03-05）

### 首页信息流
- Twitter Following 推文 + 雪球帖子混合，按 `createdAt` 倒排
- 前端 8 秒轮询 `/api/twitter/posts` 和 `/api/xueqiu/posts`
- TweetCard 根据 `tweet.source === 'xueqiu'` 显示 ❄️ 并跳转不同 URL

### 同步服务
- `twitterSync.js` — Following + 监控用户两个 setInterval（均 2 分钟）
- `xueqiuSync.js` — 监控用户帖子 + 首页 feed（5 分钟间隔）
- 雪球首页 feed: `GET /v2/statuses/home_timeline.json`，user_id=0 存入 xueqiu_posts

### Query ID 配置
- `settingsConfig.js` 管理 4 个 QueryId: homeTimeline / homeLatestTimeline / userTweets / userByScreenName
- 存储在 Supabase settings 表，key = `HOME_TIMELINE_QUERY_ID` 等
- `UserByScreenName` QueryId 无法自动抓取（仅访问用户主页时出现），需手动填入

### Twitter 用户添加
- 支持输入数字 ID 或 @handle
- `routes/twitter.js POST /users`：非数字则调 `getUserByScreenName` (GraphQL) 解析为数字 ID
- 解析后调 `loadTwitterUsers()` 刷新列表，显示实际 ID

### 用户管理页
- 路由：`/user_settings`，组件：`UserSettingsView.vue`
- 左右双栏布局（雪球 / Twitter 并排）

## 数据库配置
| 环境变量 | 说明 |
|---------|------|
| `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | 使用 Supabase 数据库 |
| 未配置 | 自动回退到 SQLite |

## 关键文件路径
| 文件 | 用途 |
|------|------|
| `backend/src/services/twitterSync.js` | Twitter 同步（Following + 监控用户，已合并） |
| `backend/src/services/xueqiuSync.js` | 雪球同步（用户帖子 + 首页 feed） |
| `backend/src/services/xueqiuService.js` | 雪球 API（含 getHomeTimeline） |
| `backend/src/services/xService.js` | X API（含 getUserByScreenName GraphQL） |
| `backend/src/config/settingsConfig.js` | 4 个 QueryId 配置 |
| `backend/src/routes/twitter.js` | Twitter posts/users/sync 路由 |
| `backend/src/routes/xueqiu.js` | 雪球 posts/users/sync 路由 |
| `backend/src/routes/twitterQueryConfig.js` | Query ID 配置路由 |
| `frontend/src/views/HomeView.vue` | 首页混合信息流 |
| `frontend/src/views/UserSettingsView.vue` | 用户管理（左右双栏） |
| `frontend/src/components/QueryIdSettings.vue` | Query ID 设置面板 |

## 数据库表结构

### xueqiu_posts
- id, user_id, user_screen_name, text, created_at
- reposts_count, comments_count, likes_count, source

### xueqiu_users
- id, user_id, screen_name, profile_image_url
- description, followers_count, friends_count, statuses_count, created_at

### twitter_posts
- id, user_id, text, created_at
- is_read, is_rendered, source

### twitter_users
- user_id, screen_name, profile_image_url, description
- followers_count, friends_count, statuses_count

## 注意事项
- Cookie 需定期更新（env: X_AUTH_TOKEN, X_CT0, X_BEARER_TOKEN, XUEQIU_COOKIE）
- Cookies 从数据库获取（优先于环境变量），通过 `getXCookies()` 统一访问

## 用户偏好

### 重启指令
- **"本地重启"** 或 **"重启"** = 仅重启本地前后端服务，**不部署到服务器**
- 部署到服务器需要明确的指令，如 "部署"、"deploy"、"推送到生产环境"
