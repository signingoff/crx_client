# X For You 项目记忆

## 后端启动方式

### 开发模式（日志写入根目录）

```bash
cd /d/xueqiu_crx/backend && npm run dev > ../backend.log 2>&1 &
```

**特点：**
- 日志输出到项目根目录 `backend.log`
- 后台运行，不占用当前终端
- 使用 `tail -f backend.log` 实时查看

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

## 数据库配置

| 环境变量 | 说明 |
|---------|------|
| `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | 使用 Supabase 数据库 |
| 未配置 | 自动回退到 SQLite |

## Query ID 更新

**For You**: `HomeTimeline` - 目前正常
**Following**: `HomeLatestTimeline` - 需要更新 ID

### 方法一：一键启动（推荐）

启动后端时自动抓取 Query ID：

```bash
# 1. 先启动 Chrome 调试模式
cd backend/scripts
start-chrome-debug.bat

# 2. 在 Chrome 中打开 https://x.com/home 并确保已登录

# 3. 一键启动（自动抓取 + 启动后端）
cd backend
npm run dev:fetch
```

### 方法二：手动抓取

```bash
# 抓取并更新 .env
cd backend
npm run fetch:query-id
```

### 方法三：手动配置

1. 打开 x.com → F12 → Network
2. 点击 Following 标签
3. 找到 `HomeLatestTimeline` 请求
4. 提取 URL 中的 Query ID: `graphql/XXXX/HomeLatestTimeline`
5. 更新 `.env` 文件中的 `HOME_LATEST_TIMELINE_QUERY_ID`

## 项目结构

```
xueqiu_crx/
├── backend/          # Node.js 后端
│   ├── src/
│   │   ├── db/      # 数据库 (SQLite/Supabase)
│   │   ├── routes/  # API 路由
│   │   └── services/# X API 调用
│   └── .env         # 环境变量
├── frontend/         # Vue 3 前端
│   └── src/
│       └── components/
│           └── TweetCard.vue
├── MEMORY.md         # 本文件
└── backend.log       # 后端日志
```
