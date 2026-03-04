# Xueqiu CRX 项目记忆

## 部署信息
- 前端: https://frontend-eight-gilt-50.vercel.app（Vercel）
- 后端: https://x-for-you-backend.onrender.com（Render，push main 自动触发）
- 数据库: Supabase

## 部署命令
```bash
git add <files> && git commit -m "..." && git push origin main  # 触发 Render
cd frontend && vercel --prod                                    # 部署 Vercel
```

## 雪球功能架构（2026-03-04 重构后）

### 路由
| 路径 | 组件 | 功能 |
|------|------|------|
| `/xueqiu` | XueqiuView.vue | 全部用户帖子流（无限滚动） |
| `/xueqiu/user/:userId` | XueqiuUserView.vue | 单用户帖子 |
| `/xueqiu/settings` | XueqiuSettingsView.vue | 用户管理 |

### 关键 API 端点
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/xueqiu/posts?page=1&limit=20` | 所有用户帖子（分页，按时间倒排） |
| GET | `/api/xueqiu/saved/:userId` | 单用户已保存帖子（最多500条） |
| GET | `/api/xueqiu/users` | 监控用户列表 |
| POST | `/api/xueqiu/users` | 添加用户 |
| DELETE | `/api/xueqiu/users/:userId` | 删除用户 |

### 关键文件
| 文件 | 说明 |
|------|------|
| `backend/src/db/supabase.js` | 数据库操作，含 `getAllXueqiuPosts(page, limit)` |
| `backend/src/routes/xueqiu.js` | 后端路由 |
| `backend/src/services/xueqiuService.js` | 雪球 API（Playwright 绕过反爬） |
| `backend/src/services/xueqiuSync.js` | 后台同步服务 |
| `frontend/src/views/XueqiuView.vue` | 帖子流主页 |
| `frontend/src/views/XueqiuUserView.vue` | 用户详情页 |
| `frontend/src/views/XueqiuSettingsView.vue` | 用户管理页 |
| `frontend/src/router/index.js` | 路由配置 |

## 数据库表结构

### xueqiu_posts
- id, user_id, user_screen_name, text, created_at
- reposts_count, comments_count, likes_count, source
- avatar（原始 URL，后端 normalizeAvatar 处理后返回前端）

### xueqiu_users
- id, user_id, screen_name, profile_image_url
- description, followers_count, friends_count, statuses_count, created_at

## 头像 URL 规范化
```js
function normalizeAvatar(url) {
  if (!url) return '';
  const firstUrl = url.split(',')[0];
  if (firstUrl.startsWith('http')) return firstUrl;
  return 'https://xavatar.imedao.com/' + firstUrl + '!240x240.jpg';
}
```
后端在 `/posts` 和 `/saved/:userId` 接口中已规范化，前端直接使用。

## 无限滚动模式（XueqiuView）
- IntersectionObserver 监听哨兵 `<div ref="sentinel">`，rootMargin: '200px'
- 触发时调用 `loadPosts(page + 1)`，追加到 `posts` 数组

## 注意事项
- 雪球用 Playwright 绕过反爬（CLAUDE.md 写的是 Puppeteer，实际是 Playwright）
- Cookie 需定期更新（env: XUEQIU_COOKIE）
- xueqiu_posts.avatar 存储原始值，接口返回时规范化
