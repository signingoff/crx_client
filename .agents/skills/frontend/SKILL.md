---
name: 前端功能
description: X For You 前端开发指南 - Vue 3 + Vite 技术栈
version: 2.1.0
---

# 前端功能开发指南

## 核心索引 (References)

| 目标 | 参考文档 |
|------|----------|
| 了解系统整体架构 | [architecture.md](@file:../../architecture.md) |
| 熟悉功能实现逻辑 | [features.md](@file:../../features.md) |
| 前后端接口联调 | [setup.md](@file:../../setup.md) |

## 技术选型
- **Framework**: Vue 3 (Composition API)
- **Tooling**: Vite, ESLint
- **Library**: Axios (API 请求), Vue Router (路由)
- **Styling**: 原生 CSS (支持极简设计)

## 常用开发命令 (Commands)
```bash
cd frontend
npm install
npm run dev      # 启动开发服务器 (默认端口 5173)
npm run build    # 构建生产环境资源包
```

## 核心组件与布局

### 1. 推文展示 (TweetCard)
- **动态渲染**: 根据 `tweet.source` 自动切换视觉风格。

### 2. 信息流控制 (HomeView)
- **自动轮询**: 每 8 秒向后端请求一次新内容。

## 开发规范
- **命名**: 组件使用 `PascalCase`，文件名与 `name` 属性保持一致。
- **路由**: 新增页面需在 `router/index.js` 中注册。
- **样式**: 优先使用 CSS 变量管理色彩主题，确保暗色模式适配。

## 资源
- **主文档**: [claude.md](@file:../../../claude.md)
- **后端文档**: [SKILL.md](@file:../../backend/SKILL.md)
