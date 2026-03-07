---
name: 后端功能
description: X For You 后端开发指南 - Node.js + Express + Supabase/SQLite 技术栈
version: 2.1.0
---

# 后端功能开发指南

## 核心索引 (References)

| 目标 | 参考文档 |
|------|----------|
| 了解系统整体架构 | [architecture.md](@file:../../architecture.md) |
| 熟悉功能实现逻辑 | [features.md](@file:../../features.md) |
| 环境配置与部署 | [setup.md](@file:../../setup.md) |

## 技术选型
- **Runtime**: Node.js (建议 v18+)
- **Framework**: Express 4.x
- **Database**: 
  - 本地: `better-sqlite3`
  - 生产: `@supabase/supabase-js`
- **HTTP Client**: `axios` (用于抓取 Twitter/雪球原始 API)

## 常用开发命令 (Commands)
```bash
cd backend
npm install
npm run dev        # 启动开发环境，日志将同步写入 backend.log
```

## 核心模式与规范

### 1. 同步逻辑 (Sync Strategy)
后端通过 `services/` 目录下的脚本执行周期性任务。
- **抓取**: 封装在 `xService.js` (X/Twitter) 和 `xueqiuService.js` (雪球) 中。
- **频率**: 定制化步长，参考 [features.md](@file:../../features.md)。

### 2. 数据库操作
统一通过 `db/` 目录下的封装进行。
- 采用参数化查询防止 SQL 注入。
- 支持 SQLite 与 Supabase 自动驱动切换。

### 3. API 规范
- **路由**: 定义在 `routes/` 目录下。
- **相应**: 成功返回 `{ success: true, data: [...] }`，失败返回 `{ success: false, error: '原因' }`。

## 故障排查
详细故障排查请参阅 [setup.md](@file:../../setup.md) 中的 Troubleshooting 章节。
