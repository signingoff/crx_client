# Cloudflare 部署方案

## 方案对比

| 方案 | 前端 | 后端 | 数据库 | 适合度 |
|------|------|------|--------|--------|
| **推荐：混合部署** | Cloudflare Pages | Vercel/Render | Supabase | ⭐⭐⭐⭐⭐ |
| **纯 Cloudflare** | Cloudflare Pages | Cloudflare Workers | D1 | ⭐⭐⭐ |
| **备用** | Vercel | Vercel | Supabase | ⭐⭐⭐⭐ |

## 为什么纯 Cloudflare 不合适？

Cloudflare Workers 的 **CPU 时间限制**（不是 wall-clock 时间）：
- 免费版：10ms CPU 时间/请求
- 付费版：50ms CPU 时间/请求

X.com API 调用需要：
- 网络请求往返：2-5 秒
- JSON 解析处理：>10ms CPU

**结论**：Workers 会在解析 X.com 响应时超时。

---

## 推荐方案：混合部署

### 1. 前端部署到 Cloudflare Pages

```bash
cd frontend

# 安装 Wrangler CLI
npm i -g wrangler

# 登录 Cloudflare
wrangler login

# 部署（首次需要绑定 GitHub 仓库）
npm run build
wrangler pages deploy dist
```

**或者通过 Git 集成自动部署：**

1. 在 Cloudflare Dashboard → Pages → "Create a project"
2. 连接 GitHub 仓库
3. 构建设置：
   - Build command: `npm run build`
   - Build output directory: `dist`
4. 添加环境变量：
   - `VITE_API_BASE`: `https://your-backend.vercel.app/api`

### 2. 更新 API 代理配置

修改 `frontend/_redirects`：

```
# 将 API 请求代理到你的后端
/api/* https://your-backend.vercel.app/api/:splat 200
```

这样前端代码可以保持相对路径 `/api/tweets/...`，Cloudflare Pages 会自动代理到后端。

### 3. 后端部署（Vercel/Render）

后端需要长时间运行，推荐使用：

**选项 A: Vercel**（已配置好）
```bash
cd backend
vercel --prod
```

**选项 B: Render**（免费且支持长时间运行）
- 注册 [render.com](https://render.com)
- New Web Service → 连接 GitHub
- 设置启动命令：`npm start`
- 免费版不会休眠（比 Vercel 更适合此场景）

---

## 纯 Cloudflare 方案（仅作参考）

如果你坚持要用纯 Cloudflare，需要大幅改造：

### 1. 创建 Worker 后端

```javascript
// backend/worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 简单的健康检查可以工作
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ success: true }));
    }

    // 但 X.com API 调用会超时
    // 因为 fetch 等待响应期间会计入 CPU 时间

    return new Response('Not implemented', { status: 501 });
  }
};
```

### 2. D1 数据库

```bash
wrangler d1 create x-for-you-db
```

但性能不如 Supabase，且需要重写所有数据库代码。

---

## 推荐配置总结

```
┌─────────────────────────────────────────────────────────┐
│           Cloudflare Pages (免费)                        │
│              x-for-you.pages.dev                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Vue 3 前端                                      │   │
│  │  - /api/* → 代理到后端                           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│           Vercel / Render (免费)                         │
│              your-backend.vercel.app                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Node.js + Express                               │   │
│  │  - 调用 X.com API (2-5s 响应时间)                 │   │
│  │  - 支持长时间运行                                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│           Supabase (免费)                                │
│              your-project.supabase.co                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PostgreSQL + read_posts 表                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 部署步骤

### 步骤 1：部署后端到 Vercel

```bash
cd backend
vercel --prod
```

记录分配的域名，例如 `https://x-for-you-backend.vercel.app`

### 步骤 2：配置前端代理

编辑 `frontend/_redirects`：
```
/api/* https://x-for-you-backend.vercel.app/api/:splat 200
```

### 步骤 3：部署前端到 Cloudflare Pages

**通过 Git 集成（推荐）：**
1. Push 代码到 GitHub
2. Cloudflare Dashboard → Pages → Create project
3. 选择仓库，构建设置：
   - Build command: `npm run build`
   - Output directory: `dist`

**通过 CLI：**
```bash
cd frontend
npm run build
wrangler pages deploy dist --project-name=x-for-you
```

### 步骤 4：配置环境变量

在 Cloudflare Pages 设置中添加：
- `VITE_API_BASE`: `/api`（使用代理，无需完整 URL）

---

## 费用对比

| 平台 | 免费额度 | 超出费用 | 推荐场景 |
|------|---------|---------|---------|
| **Cloudflare Pages** | 无限请求/500构建/月 | $0.50/百万请求 | 前端 |
| **Vercel** | 100GB-hours/月 | $0.40/GB-hour | 后端 API |
| **Render** | 750小时/月 | $7/月 | 后端（不休眠） |
| **Supabase** | 500MB/月 | $0.125/GB | 数据库 |

**个人使用完全免费。**

---

## 故障排查

### 1. API 请求 404
检查 `_redirects` 文件是否正确，路径是否匹配。

### 2. CORS 错误
在 Vercel 后端设置 CORS：
```javascript
app.use(cors({ origin: 'https://your-frontend.pages.dev' }));
```

### 3. 构建失败
检查 Node.js 版本，Cloudflare Pages 默认使用较新版本，如有问题可在环境变量设置 `NODE_VERSION=18`。

需要我帮你执行部署吗？
