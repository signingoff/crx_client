---
description: 部署应用到生产环境（Render + Vercel）
---

## 部署流程

1. 提交所有代码更改：

```bash
cd d:\xueqiu_crx && git add -A && git commit -m "deploy: 描述更改"
```

2. 推送到 GitHub（自动触发 Render 后端部署）：

```bash
cd d:\xueqiu_crx && git push origin main
```

3. 部署前端到 Vercel：

```bash
cd d:\xueqiu_crx\frontend && vercel --prod
```

4. 验证部署：
   - 后端: https://x-for-you-backend.onrender.com/api/health
   - 前端: https://frontend-eight-gilt-50.vercel.app

## 部署后本地重启（可选）

// turbo-all

5. 清理本地端口并重启, 后端日志写入 backend.log：

```bash
npx -y kill-port 3000 5173
```

```bash
cd d:\xueqiu_crx\backend && npm run dev
```

```bash
cd d:\xueqiu_crx\frontend && npm run dev
```