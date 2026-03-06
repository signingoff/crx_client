# X For You 实时任务记忆 (Session Memory)

## 当前上下文 (2026-03-07)
- **正在执行**: 文档体系重构。按照 Claude Code 的渐进式披露原则，将冗长的 `CLAUDE.md` 拆分为模块化文件，并统一为中文。
- **下一步计划**:
  1. 完成根目录 `claude.md` (入口索引) 的编写。
  2. 重构 `.claude/skills/` 下的前后端开发技能文档。
  3. 验证 `@file` 引用在 AI 环境下的关联效果。

## 环境快照
- **部署地址**:
  - 前端: https://frontend-eight-gilt-50.vercel.app (由 Vercel 托管)
  - 后端: https://x-for-you-backend.onrender.com (由 Render 托管)
- **日志监控**: 
  - 本地后端日志: `backend/backend.log`
  - 实时查看: `tail -f backend/backend.log`
- **当前重点分支**: `main`

## 关键技术决策 (近期)
1. **[2026-03-05] 混合流合并**: 决定将 Twitter 和雪球的抓取逻辑在后端合并，前端只负责接收统一格式的推文列表，减少前端由于多端并发请求导致的渲染开销。
2. **[2026-03-06] 文档重构**: 弃用单体 24KB 的 `CLAUDE.md`，改为分层解耦的 `.claude/*.md` 结构。原因：超大文档会严重占用 AI 的 Token 上下文并增加幻觉风险。

## 待办与 Bug 跟踪 (Session Specific)
- [ ] 检查 Android 原生端在 Supabase 环境下的登录稳定性。
- [ ] 优化推文列表自动刷新时的滚动位置保持。
