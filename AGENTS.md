# AGENTS

## Imported From CLAUDE.md

# X For You - 项目大脑 (Claude Code)

获取 X.com (Twitter) "For You" 与 "Following" 内容并在本地展示，同时整合雪球动态，支持多端已读同步与自动化过滤。

## 快速导航 (References)
- **架构设计**: [architecture.md](@file:.agents/architecture.md) - 系统架构、技术栈与数据流。
- **核心功能**: [features.md](@file:.agents/features.md) - 同步机制、过滤逻辑与已读系统。
- **开发与环境**: [setup.md](@file:.agents/setup.md) - 本地环境配置、环境变量与开发步骤。
- **云端部署**: [deploy.md](@file:.agents/deploy.md) - Supabase、Render 与 Vercel 部署指引。
- **测试约束**: [testing.md](@file:.agents/testing.md) - 测试命令、补测试规则与执行顺序。
- **实时记忆**: [memory.md](@file:.agents/memory.md) - 当前会话状态与近期决策。

## 常用脚本 (Scripts)

### 本地开发
- `cd backend && npm run dev > backend.log 2>&1 &`: 启动后端并重定向日志。
- `npm run dev:frontend`: 启动前端 Vite 界面。

### 部署与运维
- **部署** / **deploy**: 自动化复合操作（见 [deploy.md](@file:.agents/deploy.md) 中的规范）。

👉 **[详细部署文档](@file:.agents/deploy.md)**

## 代码风格与规范 (Guidelines)
- **语言**: 核心逻辑与文档优先使用 **中文**。
- **文档维护 (必读)**:
  - **同步更新**: 在修改核心逻辑、API 接口、数据库表结构或部署流程后，**必须**同步更新 `.agents/` 目录下对应的模块化文档。
  - **利用引用**: 充分利用各文档中的 `@file` 引用，在处理特定模块时，先阅读引用文档以确保上下文一致。
  - **实时记忆**: 每次任务结束或有重大技术决策时，更新 `.agents/memory.md`。
- **代码修改后的必做事项**:
  - 修改代码后，必须先判断本次改动影响了哪些模块、接口、数据结构和用户可见行为。
  - 必须自动运行与改动相关的测试；如果仓库中存在稳定的全量测试命令，优先运行全量测试。
  - 如果改动引入了新逻辑、修复了缺陷或改变了原有行为，并且对应目录已经存在测试体系，则必须新增或更新测试以覆盖变更。
  - 如果对应目录当前没有测试体系，不要擅自引入新的测试框架，除非用户明确要求。
  - 如果改动影响功能说明、接口行为、数据库结构、环境变量、部署流程或用户操作路径，必须同步更新 `.agents/` 下对应文档。
  - 最终回复必须说明修改内容、已运行测试、未运行测试及原因、已更新文档。
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
