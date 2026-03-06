# 部署与云端配置指南

本指南详细介绍了如何将 X For You 部署到云端生产环境。

## 自动化脚本 (Scripts)
- **部署** / **deploy**:
  1. `git add . && git commit -m "自动部署" && git push origin main` (推送到 GitHub)。
  2. `cd frontend && vercel --prod` (部署到 Vercel)。
  3. `npx kill-port 3000 5173 && cd backend && npm run dev > backend.log 2>&1 & cd ../frontend && npm run dev` (本地重启)。

## 1. 数据库：Supabase 配置

Supabase 为项目提供云端 PostgreSQL 数据库支持。若您需要从本地 SQLite 迁移到云端，请遵循以下步骤。

### 初始化步骤
1. **创建项目**: 在 [Supabase](https://supabase.com) 创建新项目（建议选择新加坡节点）。
2. **初始化表**: 进入项目的 "SQL Editor"，运行项目根目录下 `supabase/init.sql` 中的脚本。
3. **获取凭证**: 在 "Project Settings" -> "API" 中获取：
   - **Project URL** (后端使用)
   - **service_role secret** (后端使用，**绝对保密**)
   - **anon public** (前端直连模式使用)

## 2. 后端部署：Render (推荐)

项目已配置 `render.yaml` 指引 Render 进行自动化部署。

### 部署流程
1. **关联 GitHub**: 登录 Render 并关联您的代码仓库。
2. **推送代码**: 执行以下命令将代码推送至主分支，Render 将自动触发构建与部署：
   ```bash
   git add .
   git commit -m "部署描述"
   git push origin main
   ```
3. **配置环境变量**: 在 Render Dashboard 为 Web Service 配置以下变量：
   - `PORT`: `3000`
   - `SUPABASE_URL`: 您的项目 URL
   - `SUPABASE_SERVICE_KEY`: 您的 service_role key
   - `X_AUTH_TOKEN`: X.com 的 auth_token
   - `X_CT0`: X.com 的 ct0
   - `XUEQIU_COOKIE`: 雪球的 xq_a_token

## 3. 前端部署：Vercel

前端 Vue 应用通过 Vercel 进行全球 CDN 托管。

### 部署流程
1. **安装 CLI**: `npm i -g vercel`
2. **执行部署**:
   ```bash
   cd frontend
   vercel --prod
   ```
3. **生产环境 API**: 确保 `frontend/.env.production` 中的 `VITE_API_BASE` 指向您的 Render 后端地址或 Vercel 反向代理地址。

## 4. 关键注意事项

### 凭证失效处理
X.com 的 Cookie 具有时效性。当云端无法获取推文时：
1. 更新本地/云端环境变量中的 `X_AUTH_TOKEN`。
2. 或直接修改数据库 `settings` 表中的对应键值（系统优先读取数据库）。

### 速率与额度限制
- **Vercel**: 免费版 Serverless 函数执行时长限制为 10s，若 Query ID 抓取超时，请改用本地手动配置。
- **Supabase**: 免费版有 500MB 存储限制，建议定期清理 30 天前的已读推文。

## 相关引用
- **架构流向**: [architecture.md](@file:.claude/architecture.md)
- **本地配置**: [setup.md](@file:.claude/setup.md)
