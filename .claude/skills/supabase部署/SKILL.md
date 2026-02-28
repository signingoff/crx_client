---
name: Supabase 部署
description: 使用 Supabase 作为数据库的部署方案
---

# Supabase 部署方案

## 为什么选择 Supabase

| 特性 | 免费额度 | 说明 |
|------|----------|------|
| PostgreSQL 数据库 | 500MB | 足够存储数万条推文记录 |
| API 请求 | 无限 | 但有连接数限制 |
| 实时订阅 | 200 concurrent | 可选功能 |
| 存储 | 1GB | 文件存储（本项目未使用） |

## 架构图

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Vercel        │      │   Railway/Render │      │   Supabase      │
│   (前端 Vue)    │◄────►│   (后端 Node)    │◄────►│   (PostgreSQL)  │
│                 │      │   - X API 调用    │      │   - 已读状态     │
│                 │      │   - 日语过滤      │      │   - 推文记录     │
└─────────────────┘      └──────────────────┘      └─────────────────┘
     免费 forever              免费额度               免费 500MB
```

## 文件结构

```
backend/
├── src/
│   ├── db/
│   │   ├── supabase.js      # Supabase 客户端封装
│   │   └── sqlite.js        # 保留兼容（可选）
│   └── ...
supabase/
└── init.sql                 # 数据库初始化脚本
DEPLOY.md                    # 部署指南
```

## Supabase 数据库操作

### 表结构

```sql
CREATE TABLE read_posts (
  id SERIAL PRIMARY KEY,
  tweet_id TEXT NOT NULL UNIQUE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### JavaScript API

```javascript
import {
  isPostLoaded,
  markPostsAsLoaded,
  markPostAsRead,
  getReadStats
} from '../db/supabase.js';

// 检查是否已加载
const loaded = await isPostLoaded('123456');

// 批量标记已加载
await markPostsAsLoaded(['123', '456', '789']);

// 标记已读/未读
await markPostAsRead('123', true);  // 已读
await markPostAsRead('123', false); // 未读

// 获取统计
const stats = await getReadStats();
// { total: 100, read: 30, unread: 70 }
```

## 环境变量

### 后端 .env

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...service_role...

# X.com (仍然需要)
X_AUTH_TOKEN=xxx
X_CT0=xxx
```

### 前端 .env（可选直连）

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...anon...
```

## 部署步骤

1. **创建 Supabase 项目**
   - 访问 https://supabase.com
   - 新建项目，选择 Singapore Region
   - 执行 `supabase/init.sql` 创建表

2. **获取连接信息**
   - Project Settings → API
   - 复制 Project URL 和 service_role key

3. **配置后端**
   - 更新 `backend/.env`
   - `npm install` 安装 @supabase/supabase-js

4. **部署后端**
   - Railway/Render 都可以
   - 添加环境变量

## 优势对比

| 方案 | 数据库 | 优点 | 缺点 |
|------|--------|------|------|
| SQLite + Railway | 本地文件 | 简单，无需外部依赖 | Railway 重启数据可能丢失 |
| Supabase + Railway | PostgreSQL | 数据持久化，免费额度大 | 需要网络连接 |
| Supabase 直连 | PostgreSQL | 可去掉后端，更简单 | X API 需要后端代理 |

## 常见问题

**Q: 免费额度够用吗？**
A: 500MB 可以存储约 50-100 万条推文记录，足够个人使用。

**Q: 数据安全吗？**
A: Supabase 提供 SSL 连接和每日自动备份。

**Q: 需要迁移现有 SQLite 数据吗？**
A: 可选。如果不迁移，之前加载的推文会重新显示一次。

**Q: 如何清理旧数据？**
A: 在 Supabase SQL Editor 执行：
```sql
DELETE FROM read_posts WHERE created_at < NOW() - INTERVAL '30 days';
```
