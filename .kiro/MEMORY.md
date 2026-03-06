# X For You 项目记忆

## 部署信息
- 前端: https://frontend-eight-gilt-50.vercel.app（Vercel）
- 后端: https://x-for-you-backend.onrender.com（Render，push main 自动触发）
- 数据库: Supabase

## 部署命令
```bash
git add <files> && git commit -m "..." && git push origin main  # 触发 Render
cd frontend && vercel --prod                                    # 部署 Vercel
```

## 后端启动方式

### 开发模式（日志路径）
- **后端日志**: `D:\xueqiu_crx\backend\backend.log`
- **前端**: 不记录日志

```bash
# 启动后端（日志写入 backend/backend.log）
cd /d/xueqiu_crx/backend && npm run dev > backend.log 2>&1 &

# 启动前端（无日志文件）
cd /d/xueqiu_crx/frontend && npm run dev
```

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
