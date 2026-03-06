# 开发环境与部署指南

## 本地开发指南

### 1. 依赖安装
```bash
# 建议分别在 backend 和 frontend 目录执行
npm install
```

### 2. 环境变量配置
在 `backend/` 下创建 `.env` 文件，内容如下：
```env
PORT=3000
CORS_ORIGIN=http://localhost:5173

# X.com 凭证 (必需，定期在浏览器 F12 中更新)
X_AUTH_TOKEN=你的_auth_token
X_CT0=你的_ct0
X_BEARER_TOKEN=你的_bearer_token

# 雪球凭证
XUEQIU_COOKIE=你的_xq_a_token
```

### 3. 启动项目
使用根目录的 `npm` 脚本同时启动：
- `npm run dev:backend`: (在根目录执行) 内部调用后端启动。
- `cd backend && npm run dev > backend.log 2>&1 &`: (在 backend 目录执行) 推荐方式，启动并重定向日志到 `backend/backend.log`。
- `npm run dev:frontend`: 启动 Vite 开发服务器 (默认端口 5173)。

## 部署流程

项目目前采用双平台部署方案（Render 后端 + Vercel 前端）。有关云端数据库初始化和详细部署步骤，请参阅：

👉 **[云端部署详细指南](@file:deploy.md)**

## 故障排查 (Troubleshooting)

### 端口冲突
若提示端口被占用（常见于 Windows 自带 Node 进程残留）：
```powershell
# 查找并关闭 3000 端口
npx kill-port 3000
```

### 认证失效 (401/403)
由于推文抓取依赖 Cookie，当看到认证错误时：
1. 在浏览器无痕模式重新登录 X.com 和雪球。
2. 提取最新的 `auth_token` / `xq_a_token`。
3. 更新数据库 `settings` 表或本地 `.env` 文件。

### 数据库迁移 (Supabase)
若要从 SQLite 切换到 Supabase：
1. 在 Supabase 创建项目，运行 `supabase/init.sql`。
2. 在 `.env` 中填入 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY`。
3. 重新启动后端，系统会自动识别并切换驱动。
