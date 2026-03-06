# X For You - 项目大脑 (Claude Code)

获取 X.com (Twitter) "For You" 与 "Following" 内容并在本地展示，同时整合雪球动态，支持多端已读同步与自动化过滤。

## 快速导航 (References)
- **架构设计**: [architecture.md](@file:.claude/architecture.md) - 系统架构、技术栈与数据流。
- **核心功能**: [features.md](@file:.claude/features.md) - 同步机制、过滤逻辑与已读系统。
- **开发与环境**: [setup.md](@file:.claude/setup.md) - 本地环境配置、环境变量与开发步骤。
- **云端部署**: [deploy.md](@file:.claude/deploy.md) - Supabase、Render 与 Vercel 部署指引。
- **更新日志**: [changelog.md](@file:.claude/changelog.md) - 项目演进历史。
- **实时记忆**: [memory.md](@file:.claude/memory.md) - 当前会话状态与近期决策。

## 常用脚本 (Scripts)

### 本地开发
- `cd backend && npm run dev > backend.log 2>&1 &`: 启动后端并重定向日志。
- `npm run dev:frontend`: 启动前端 Vite 界面。

### 部署与运维
- **部署** / **deploy**: 自动化复合操作（见 [deploy.md](@file:.claude/deploy.md) 中的规范）。

👉 **[详细部署文档](@file:.claude/deploy.md)**

## 代码风格与规范 (Guidelines)
- **语言**: 核心逻辑与文档优先使用 **中文**。
- **文档维护 (必读)**: 
  - **同步更新**: 在修改核心逻辑、API 接口、数据库表结构或部署流程后，**必须**同步更新 `.claude/` 目录下对应的模块化文档。
  - **利用引用**: 充分利用各文档中的 `@file` 引用，在处理特定模块时，先阅读引用文档以确保上下文一致。
  - **实时记忆**: 每次任务结束或有重大技术决策时，更新 `.claude/memory.md`。
- **命名**: 
  - Vue 组件: `PascalCase` (如 `TweetCard.vue`)。
  - 函数/路径: `camelCase` (如 `getTweets`)。
  - 数据库字段: `snake_case` (如 `is_read`)。
- **提交**: 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。
- **API 响应**: 统一格式 `{ success: true, data: {} }`。

## 技术栈摘要
- **前端**: Vue 3, Vite, Axios.
- **后端**: Node.js, Express, better-sqlite3.
- **数据库**: Supabase (云端) / SQLite (本地).
- **移动端**: Kotlin, Jetpack Compose.
