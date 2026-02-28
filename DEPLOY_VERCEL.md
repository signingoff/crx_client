# Vercel 部署指南

## 前置要求

1. 注册 [Vercel](https://vercel.com) 账号
2. 安装 Vercel CLI: `npm i -g vercel`
3. 项目已推送到 GitHub

## 部署步骤

### 1. 部署后端

```bash
cd backend

# 登录 Vercel
vercel login

# 部署（首次）
vercel

# 后续更新
vercel --prod
```

**配置环境变量：**

在 Vercel Dashboard → Project Settings → Environment Variables 中添加：

| 变量名 | 值 |
|--------|-----|
| `SUPABASE_URL` | https://your-project.supabase.co |
| `SUPABASE_SERVICE_KEY` | your-service-role-key |
| `X_AUTH_TOKEN` | your_x_auth_token |
| `X_CT0` | your_x_csrf_token |

### 2. 更新前端 API 地址

修改 `frontend/.env.production`：

```env
VITE_API_BASE=https://your-backend.vercel.app/api
```

然后更新 `frontend/vercel.json` 中的后端地址：

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend.vercel.app/api/$1"
    }
  ]
}
```

### 3. 部署前端

```bash
cd frontend

# 部署（首次）
vercel

# 后续更新
vercel --prod
```

## 重要注意事项

### Cookie 配置

X.com 的 Cookie (`auth_token`, `ct0`) 需要定期更新。在 Vercel Dashboard 中更新环境变量后，需要重新部署才能生效。

### Query ID 自动获取

Vercel 的 Serverless Functions 有执行时间限制（免费版 10s），如果自动获取 Query ID 超时，可能需要：
1. 在本地获取 Query ID
2. 通过 API 手动更新

### CORS 配置

后端 `backend/api/index.js` 已配置 CORS，允许所有来源。如需限制：

```javascript
app.use(cors({
  origin: 'https://your-frontend.vercel.app'
}));
```

## 故障排查

### 1. API 返回 404
- 检查 `vercel.json` 路由配置
- 确认后端已正确部署

### 2. 数据库连接失败
- 检查 Supabase 环境变量
- 确认 Supabase 项目处于 Active 状态

### 3. 无法获取推文
- 检查 X.com Cookie 是否过期
- 查看 Vercel Functions 日志

## 免费额度

Vercel 免费版限制：
- Functions: 每月 100GB-hours
- 构建时间: 每月 6000 分钟
- 带宽: 每月 100GB

对于个人使用通常足够。
