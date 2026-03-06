# X For You - Claude 上下文

## 项目概述

获取 X.com For You 页面内容，在个人本地环境展示，支持内容过滤和自动刷新。

**核心设计理念**:
- 隐私优先：数据本地处理，不依赖第三方服务
- 轻量级：前后端分离，快速启动
- 可定制：日语过滤等可配置
- 纯 Web：无需 Electron，浏览器即可访问

## 技术架构

### 技术选型

| 技术 | 版本 | 原因 |
|------|------|------|
| Vue 3 | ^3.3.0 | 响应式、Composition API 逻辑复用 |
| Vite | ^5.0.0 | 快速热更新、现代化构建 |
| Node.js | 18+ | X API 需要 Cookie 认证 |
| Express | ^4.18.0 | 轻量级 Web 框架 |
| better-sqlite3 | ^9.0.0 | 本地数据持久化（开发环境） |
| Supabase | ^2.39.0 | 云端数据库（生产环境） |
| Axios | ^1.6.0 | HTTP 请求库 |

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        浏览器                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Vue 3 前端                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐ │  │
│  │  │ TweetCard   │  │ TweetList   │  │  HomeView     │ │  │
│  │  │ - 推文展示   │  │ - 列表容器   │  │  - 主页面     │ │  │
│  │  │ - 三连击     │  │             │  │  - 自动刷新   │ │  │
│  │  │ - Lightbox  │  │             │  │               │ │  │
│  │  └─────────────┘  └─────────────┘  └───────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────┐
│                      Node.js 后端                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Express API                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐ │  │
│  │  │ /twitter/*  │  │ /xueqiu/*   │  │ /tweets/queryid-config│ │  │
│  │  │ - 获取推文   │  │ - 雪球帖子   │  │ - Query ID    │ │  │
│  │  │ - 用户管理   │  │ - 用户管理   │  │ - 手动配置    │ │  │
│  │  └─────────────┘  └─────────────┘  └───────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              SQLite / Supabase 数据库                  │  │
│  │  表: twitter_posts, xueqiu_posts, settings            │  │
│  │  - 推文/帖子存储                                       │  │
│  │  - is_read: 已读状态                                   │  │
│  │  - Query ID / Cookies 配置                             │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                    X.com GraphQL API                         │
│  - HomeTimeline                                              │
│  - 需 Cookie 认证                                             │
│  - Query ID 可能变化                                          │
└─────────────────────────────────────────────────────────────┘
```

## 文件结构

```
xueqiu_crx/
├── .claude/
│   └── skills/
│       ├── 前端功能/
│       │   └── SKILL.md      # 前端详细文档
│       └── 后端功能/
│           └── SKILL.md      # 后端详细文档
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── settingsConfig.js # Query ID 和 Cookie 配置
│   │   ├── db/
│   │   │   └── sqlite.js     # SQLite 数据库
│   │   ├── routes/
│   │   │   ├── twitterQueryConfig.js  # Query ID 配置路由
│   │   │   ├── twitter.js    # Twitter API 路由
│   │   │   └── xueqiu.js     # 雪球 API 路由
│   │   ├── services/
│   │   │   └── xService.js   # X API 调用
│   │   └── index.js          # 入口文件
│   ├── data/
│   │   └── posts.db          # SQLite 数据库文件
│   ├── .env                  # 环境变量
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── tweets.js     # API 封装（Query ID、已读标记）
│   │   │   └── xueqiu.js     # 雪球 API 封装
│   │   ├── components/
│   │   │   ├── TweetCard.vue # 推文卡片组件
│   │   │   └── TweetList.vue # 推文列表
│   │   ├── views/
│   │   │   └── HomeView.vue  # 主页面
│   │   ├── App.vue           # 根组件
│   │   └── main.js           # 入口
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── CLAUDE.md                 # 本文件
└── package.json              # 根目录配置
```

## 核心功能设计

### 1. 后端过滤逻辑

**过滤流程**（按执行顺序）：
1. 从 X API 获取原始推文
2. 日语过滤（检测平假名/片假名）
3. 已加载推文过滤（查询 SQLite）
4. 返回过滤后的推文给前端

**原因**：过滤逻辑统一在后端，前端只负责展示，减少数据传输。

### 2. 自动刷新机制

- **间隔**：8秒轮询数据库
- **防缓存**：URL 加时间戳参数 `?t=Date.now()`
- **新推文处理**：后台获取但不自动渲染，显示 "Load X posts" 按钮
- **加载新推文**：点击后插入列表顶部，滚动到顶部，标记为已加载

### 3. 已读/未读系统

- **触发方式**：三连击卡片（500ms 内点击 3 次）
- **状态存储**：SQLite `read_posts.is_read` 字段
- **视觉反馈**：左上角绿色 ✓ 标记（不改变背景色）
- **数据库**：首次加载时 `is_read=0`，三连击后 `is_read=1`
- **自动同步**：前端每5秒查询服务器已读状态，更新本地显示（解决多客户端同步问题）

### 4. 用户认证与登录

**需求**: Web 系统需要支持用户登录功能，以保护敏感配置和数据。

**认证方式**: JWT (JSON Web Token)

**登录流程**:
1. 用户访问系统时，前端检查本地存储的 JWT token
2. 如未登录，重定向到登录页面
3. 后端验证用户名/密码，返回 JWT token
4. 前端将 token 存储在 localStorage，后续请求携带在 Authorization header 中

**API 端点**:
- `POST /api/auth/login` - 登录，返回 JWT
- `POST /api/auth/logout` - 登出（客户端清除 token）
- `GET /api/auth/me` - 获取当前用户信息

**受保护的路由**:
- `/user_settings` - 用户管理
- `/queryid-config` - Query ID 配置
- 所有 POST/DELETE 操作（修改类 API）

**Token 配置**:
```env
# backend/.env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d  # token 有效期
```

**前端实现**:
- 登录页面: `LoginView.vue`
- 路由守卫: 未登录用户重定向到登录页
- Axios 拦截器: 自动附加 Authorization header

### 5. 媒体处理策略

| 媒体类型 | 处理方式 | 原因 |
|---------|---------|------|
| 静态图片 | 本地展示 + Lightbox | 直接可用 |
| 视频/GIF | 跳转原推文 | X 视频需要 referer/cookie |
| 缩略图 | `?name=small` | 优化加载速度 |

### 5. 浏览器窗口滚动

**设计变更**：从 div 内滚动改为浏览器窗口滚动

**原因**：
- 更自然的滚动体验
- 浏览器原生滚动条行为
- 更好的移动端适配

**实现**：
- 移除 `body { overflow: hidden }`
- Header 使用 `position: sticky`
- 滚动条样式定义在全局

### Supabase 配置（云端部署）

**文件**: `backend/.env`

```env
# Supabase（可选，替代 SQLite 用于云端部署）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**设置步骤**:
1. 注册 https://supabase.com，创建项目
2. 执行 `supabase/init.sql` 创建表
3. Project Settings → API → 复制 `service_role key`
4. 安装依赖: `npm install @supabase/supabase-js`
5. 代码自动切换（检测到 SUPABASE_URL 则使用 Supabase）

**详细部署指南**: [DEPLOY.md](./DEPLOY.md)

## 代码规范

### 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 组件 | PascalCase | `TweetCard.vue` |
| 工具函数 | camelCase | `isJapaneseText()` |
| API 端点 | kebab-case | `/mark-rendered` |
| 环境变量 | UPPER_SNAKE_CASE | `X_AUTH_TOKEN` |
| 数据库表 | snake_case | `read_posts` |

### 错误处理

**后端统一格式**：
```javascript
// 成功
{ success: true, data: {...} }

// 失败
{ success: false, error: '错误信息' }
```

**前端处理**：
- API 层：捕获错误，统一处理
- 视图层：显示友好错误信息

### 注释规范

```javascript
/**
 * 函数功能描述
 * @param {string} param1 - 参数说明
 * @param {number} param2 - 参数说明
 * @returns {Promise<Object>} 返回值说明
 */
```

## 配置文件

### 后端 .env

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173

# X.com Cookies（必需，定期更新）
X_AUTH_TOKEN=your_auth_token_here
X_CT0=your_csrf_token_here

# X API Bearer Token（必需）
# 从浏览器 Network 中获取，去掉 "Bearer " 前缀
X_BEARER_TOKEN=your_bearer_token_here

# X API Query ID 配置（可选，会自动更新）
HOME_TIMELINE_QUERY_ID=MpnCeE0hy8m5eWobPx8euw
HOME_LATEST_TIMELINE_QUERY_ID=MpnCeE0hy8m5eWobPx8euw
```

**Token 获取方法**：
1. 浏览器登录 x.com
2. F12 打开开发者工具
3. Application/Storage → Cookies → x.com
4. 复制 `auth_token` 和 `ct0`
5. 在 Network 标签中找到任意 X API 请求，复制 `authorization` 头中的 Bearer token（去掉 `Bearer ` 前缀）

### Query ID 更新

**配置位置**: 数据库 `settings` 表 或 前端设置面板

**支持的 Query ID**:
- `HOME_LATEST_TIMELINE_QUERY_ID` - Following 时间线
- `USER_TWEETS_QUERY_ID` - 用户推文
- `USER_BY_SCREEN_NAME_QUERY_ID` - 用户名解析

**更新方式**:

1. **自动检测**（推荐）
   - 前端设置面板 → "🔍 自动从 X.com 检测"
   - 后端自动抓取并更新到数据库

2. **手动配置**
   - 前端设置面板 → 手动输入 Query ID
   - 或更新数据库 `settings` 表

3. **从 Network 抓取**
   - 打开 x.com → F12 → Network
   - 找到对应请求（如 HomeLatestTimeline）
   - 提取 Query ID：`graphql/QUERY_ID/OperationName`
   - 粘贴到前端设置面板

## 开发指南

### 启动开发环境

```bash
# 1. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 2. 配置环境变量
cd ../backend
cp .env.example .env
# 编辑 .env，填入 X_AUTH_TOKEN、X_CT0 和 X_BEARER_TOKEN

# 3. 启动后端（端口 3000）
npm run dev

# 4. 新终端启动前端（端口 5173）
cd ../frontend
npm run dev

# 5. 访问 http://localhost:5173
```

### 常用命令

```bash
# 根目录
npm run dev:backend     # 启动后端
npm run dev:frontend    # 启动前端

# 后端
cd backend
npm run dev             # 开发模式
npm start               # 生产模式

# 前端
cd frontend
npm run dev             # 开发模式
npm run build           # 构建生产包
npm run preview         # 预览生产构建
```

### 重启和部署流程

**重启时需要同时执行以下操作：**

```bash
# 1. 提交代码更改
git add -A
git commit -m "描述更改"

# 2. 推送到 GitHub 触发 Render 后端自动部署
git push origin main

# 3. 部署前端到 Vercel
cd frontend
vercel --prod

# 4. 本地重启前后端（后端日志写入 backend.log）
npx kill-port 3000 5173   # 清理端口
cd backend && npm run dev > backend.log 2>&1 &
cd ../frontend && npm run dev
```

**部署地址：**
- 前端: https://frontend-eight-gilt-50.vercel.app
- 后端: https://x-for-you-backend.onrender.com
- 本地: http://localhost:5173 (前端), http://localhost:3000 (后端)

### 端口冲突解决

```bash
# Windows - 查找占用 3000 端口的进程
netstat -ano | findstr :3000

# 杀掉进程
taskkill /PID <PID> /F

# 或使用 npx
npx kill-port 3000 5173
```

## 功能清单

### 已实现功能

- [x] 单栏推文/帖子混合列表展示（Twitter Following + 雪球帖子，按时间倒排）
- [x] 自动刷新（8秒轮询数据库）
- [x] 日语/韩语推文过滤
- [x] 三连击切换已读/未读
- [x] 用户详细信息显示（简介、位置、关注/粉丝数、注册时间）
- [x] 图片网格布局 + Lightbox
- [x] @用户名自动链接
- [x] 话题标签高亮
- [x] 长推文 Show more/less
- [x] 转发推文识别
- [x] 来源感知跳转按钮（❄️ 雪球帖子 / X.com 推文）
- [x] 浏览器窗口滚动
- [x] X 文章卡片显示（x.com/i/article）
- [x] 已读状态存储（Supabase）
- [x] 部署到 Render + Vercel
- [x] Twitter Following 推文同步（2分钟间隔）
- [x] Twitter 监控用户推文同步（2分钟间隔，同文件 twitterSync.js）
- [x] Twitter 监控用户支持 @handle 自动解析为数字 ID（GraphQL UserByScreenName）
- [x] 雪球用户帖子同步（5分钟间隔）
- [x] 雪球首页 feed 同步（关注用户帖子）
- [x] 用户管理页（/user_settings）左右双栏布局，分别管理雪球和 Twitter 用户
- [x] Query ID 自动检测 + 手动配置（含 UserByScreenName QueryId）

### 待实现功能

- [ ] 视频直接播放（需代理方案）
- [ ] 推文详情页
- [ ] 用户个人页
- [ ] 搜索功能
- [ ] 多语言支持

### 技术债务

- [x] TypeScript 类型定义
- [x] 单元测试
- [ ] 前端状态管理（Pinia）
- [ ] PWA 支持

## 常见问题排查

### 1. API 返回 401/403

**原因**: Cookie 过期
**解决**: 重新获取 `auth_token` 和 `ct0`

### 2. "Query not found" 错误

**原因**: X API 的 Query ID 已更新
**解决**: 按上述步骤更新 `HOME_TIMELINE_QUERY_ID`

### 3. 获取不到新推文

**检查清单**:
- [ ] Query ID 是否有效
- [ ] Cookie 是否过期
- [ ] 网络连接是否正常
- [ ] SQLite 数据库是否可读写

### 4. 前端显示空白

**检查清单**:
- [ ] 后端服务是否启动
- [ ] 浏览器控制台是否有错误
- [ ] API 请求是否成功

### 5. 图片无法显示

**检查**:
- 缩略图 URL 是否正确拼接 `?name=small`
- 是否使用 `pbs.twimg.com` 域名
- 网络是否能访问 X 图片服务器

## 扩展开发

### 添加新过滤器

```javascript
// backend/src/services/xService.js
function isCustomFilter(text) {
  return text.includes('特定关键词');
}

// 在 getForYouTweets 中添加
return tweets.filter(tweet => !isCustomFilter(tweet.text));
```

### 添加新 API 端点

```javascript
// backend/src/routes/twitterQueryConfig.js
router.get('/custom-endpoint', async (req, res) => {
  try {
    const data = await customService();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// frontend/src/api/tweets.js
export async function customApiCall() {
  const response = await axios.get(`${API_BASE}/tweets/custom-endpoint`);
  return response.data;
}
```

## 性能优化

### 当前优化措施

1. **后端过滤**: 减少数据传输
2. **SQLite 索引**: 加速查询
3. **图片缩略图**: `name=small` 减少带宽
4. **15秒刷新间隔**: 避免触发 X 速率限制

### 可优化点

1. **虚拟滚动**: 大量推文时的渲染优化
2. **图片懒加载**: 使用 Intersection Observer
3. **请求合并**: 减少 API 调用次数
4. **缓存策略**: 合理使用浏览器缓存

## 安全注意事项

1. **Cookie 安全**: 不要提交 `.env` 文件到版本控制
2. **SQL 注入**: 使用参数化查询（better-sqlite3 自动处理）
3. **XSS 防护**: Vue 自动转义 HTML，注意 `v-html` 使用
4. **CORS**: 只开放必要的本地端口

## 依赖关系

```
frontend (Vue 3 + Vite)
  ├── axios → 发送 HTTP 请求
  └── vue (runtime)

backend (Express)
  ├── axios → 调用 X API
  ├── better-sqlite3 → 数据库
  ├── cors → 跨域支持
  ├── dotenv → 环境变量
  └── express → Web 框架
```

## 雪球网功能

### 概述

获取雪球网(xueqiu.com)用户历史发言。

### 技术方案

- **认证方式**: 用户提供 Cookie (xq_a_token)
- **请求方式**: axios 直接请求（不使用 Puppeteer）
- **数据库表**:
  - `xueqiu_users` - 存储监控用户信息
  - `xueqiu_posts` - 存储用户帖子
- **API 端点**:
  - `GET /api/xueqiu/posts` - 获取帖子列表（分页）
  - `POST /api/xueqiu/posts/:id/read` - 标记已读/未读
  - `GET /api/xueqiu/sync` - 手动触发同步
  - `GET /api/xueqiu/users` - 获取监控用户列表
  - `POST /api/xueqiu/users` - 添加监控用户
  - `DELETE /api/xueqiu/users/:userId` - 删除监控用户

### 关键文件

| 文件 | 说明 |
|------|------|
| `backend/src/services/xueqiuService.js` | 雪球 API 服务（含 getHomeTimeline） |
| `backend/src/services/xueqiuSync.js` | 同步服务（含 syncHomeTimeline） |
| `backend/src/services/twitterSync.js` | Twitter Following + 监控用户同步（合并后） |
| `backend/src/routes/xueqiu.js` | 后端路由 |
| `backend/src/routes/twitter.js` | Twitter 路由（posts/users/sync） |
| `backend/src/db/supabase.js` | 数据库操作 |
| `frontend/src/views/HomeView.vue` | 首页（Twitter + 雪球混合流） |
| `frontend/src/views/UserSettingsView.vue` | 用户管理页面（左右双栏） |

### 雪球 API

```
# 用户时间线
https://xueqiu.com/statuses/user_timeline.json?user_id={ID}&page={页}&type=1

# 用户信息
https://xueqiu.com/v4/users/{id}
```

### 配置

```env
# backend/.env
XUEQIU_COOKIE=your_xq_a_token_here
```

### 数据库表

```sql
-- 雪球用户表
CREATE TABLE xueqiu_users (
  id BIGINT PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  screen_name TEXT,
  profile_image_url TEXT,
  description TEXT,
  followers_count INTEGER DEFAULT 0,
  friends_count INTEGER DEFAULT 0,
  statuses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 雪球帖子表
CREATE TABLE xueqiu_posts (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  user_screen_name TEXT,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  reposts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  source TEXT
);
```

### 注意事项

- 雪球有反爬机制，使用 xq_a_token Cookie 认证（需定期更新）
- 添加用户时只保存 ID，后台自动同步更新用户名
- 用户名自动去除 "-雪球" 后缀
- 首页 feed 同步使用 `/v2/statuses/home_timeline.json`（user_id=0 存储）

## 更新日志

### 2026-03-05
- 重构首页：Twitter Following + 雪球帖子混合流，按时间倒排
- 来源感知跳转按钮（❄️ 雪球 / X.com）
- 删除独立 /xueqiu 路由，雪球帖子通过 /api/xueqiu/posts 统一读取
- 重命名 XueqiuSettingsView → UserSettingsView，/user_settings 路由
- user_settings 页面左右双栏布局（雪球 + Twitter 并排）
- 删除推文 metrics 显示（replies/retweets/likes）
- 合并 twitterUserSync.js → twitterSync.js（统一 2 分钟间隔）
- 雪球首页 feed 同步（getHomeTimeline，关注用户帖子）
- Twitter 监控用户支持 @handle 自动解析（GraphQL UserByScreenName）
- UserByScreenName QueryId 支持手动配置 + 自动检测
- **代码清理**:
  - 删除 `auth.js`，统一使用 `getXCookies()` 从数据库获取 Cookie
  - 重命名 `tweets.js` → `twitterQueryConfig.js`
  - 删除未使用的 `settings.js` 和 `settings-db.js` 路由
  - 后端日志写入 `backend.log`

### 2026-03-01
- 添加韩语推文过滤
- 添加 Supabase settings 表存储配置
- 添加已读状态自动同步（每5秒）
- 部署到 Render + Vercel + Supabase
- 添加 X 文章卡片显示
- 添加 HTML 实体解码和 URL 链接处理

### 2026-02-27
- 添加三连击切换已读/未读
- 添加 @用户名链接
- 改为浏览器窗口滚动
- 扩展 Skills 文档

### 2026-02-26
- 添加用户详细信息显示
- 修复用户信息字段来源（user.core vs user.legacy）
- 添加 SQLite 已读标记

### 2026-02-25
- 移除 Electron，改为纯 Web 应用
- 添加单栏布局
- 添加自动刷新
- 添加日语过滤

---

**详细文档**: [.claude/skills/](./.claude/skills/)
