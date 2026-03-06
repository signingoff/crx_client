---
description: 启动本地开发环境（后端 + 前端）
---

// turbo-all

## 启动开发环境

1. 清理可能占用的端口：

```bash
npx -y kill-port 3000 5173
```

2. 启动后端服务（端口 3000）：

```bash
cd d:\xueqiu_crx\backend && npm run dev
```

3. 启动前端服务（端口 5173）：

```bash
cd d:\xueqiu_crx\frontend && npm run dev
```

4. 验证服务启动：
   - 后端健康检查: http://localhost:3000/api/health
   - 前端页面: http://localhost:5173
