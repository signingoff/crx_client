---
description: 重启本地前后端服务
---

// turbo-all

## 重启服务

1. 杀掉所有 Node 进程：

```bash
taskkill -F -IM node.exe
```

2. 清理端口：

```bash
npx -y kill-port 3000 5173
```

3. 启动后端（端口 3000，日志写入 backend.log）：

```bash
cd d:\xueqiu_crx\backend && npm run dev
```

4. 启动前端（端口 5173）：

```bash
cd d:\xueqiu_crx\frontend && npm run dev
```
