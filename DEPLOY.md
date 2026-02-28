# Supabase 部署指南

## 1. 创建 Supabase 项目

1. 访问 https://supabase.com
2. 注册/登录账号
3. 点击 "New Project"
4. 填写项目名称和密码
5. 选择最近的 Region（如 Singapore）
6. 等待项目创建完成（约 2 分钟）

## 2. 初始化数据库

1. 进入项目 Dashboard
2. 点击左侧 "SQL Editor"
3. 新建 Query
4. 复制粘贴 `supabase/init.sql` 中的内容
5. 点击 "Run" 执行

## 3. 获取连接信息

1. 点击左侧 "Project Settings" → "API"
2. 复制以下信息：
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon public**: `eyJ...` (前端使用)
   - **service_role secret**: `eyJ...` (后端使用，**不要泄露**)

## 4. 配置后端环境变量

编辑 `backend/.env`:

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173

# X.com Cookies
X_AUTH_TOKEN=your_auth_token_here
X_CT0=your_csrf_token_here

# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

## 5. 安装依赖并启动

```bash
cd backend
npm install
npm run dev
```

## 6. 部署到 Railway/Render

### Railway 部署

1. 推送代码到 GitHub
2. 登录 railway.app，新建项目
3. 选择 "Deploy from GitHub repo"
4. 添加环境变量（同上）
5. 部署完成

### Render 部署

创建 `render.yaml`:

```yaml
services:
  - type: web
    name: x-for-you-backend
    runtime: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: X_AUTH_TOKEN
        sync: false
      - key: X_CT0
        sync: false
```

## 7. 前端配置（可选直连 Supabase）

如果需要前端直接访问 Supabase（绕过后端）：

```javascript
// frontend/src/api/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default supabase
```

`.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 注意事项

1. **service_role key** 有完全权限，不要提交到 GitHub
2. 免费版 Supabase 有 500MB 存储限制
3. 定期清理旧数据（如需）:
   ```sql
   DELETE FROM read_posts WHERE created_at < NOW() - INTERVAL '30 days';
   ```
