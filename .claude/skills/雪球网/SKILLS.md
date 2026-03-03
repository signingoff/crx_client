# 雪球网功能 SKILL

## 概述

雪球网用户历史发言获取功能，使用 Playwright 无头浏览器绕过反爬机制。

## 技术栈

- Playwright - 无头浏览器（自带 Chromium）
- Express - 后端框架
- Vue 3 - 前端框架
- Supabase - 数据库存储

## 文件结构

```
backend/
├── .env                      # XUEQIU_COOKIE 配置
├── src/
│   ├── services/
│   │   ├── xueqiuService.js  # 雪球 API 服务（Playwright）
│   │   └── xueqiuSync.js     # 后台同步服务（支持多用户）
│   ├── routes/
│   │   └── xueqiu.js         # 后端路由
│   └── db/
│       └── supabase.js       # Supabase 数据库操作

frontend/
├── src/
│   ├── api/
│   │   └── xueqiu.js         # 前端 API
│   ├── views/
│   │   ├── XueqiuView.vue           # 雪球发言列表页
│   │   └── XueqiuSettingsView.vue   # 雪球用户管理页
│   ├── router/
│   │   └── index.js           # 路由配置
│   └── components/
│       └── QueryIdSettings.vue # 原设置页（保留兼容）
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/xueqiu/users | 获取用户列表 |
| POST | /api/xueqiu/users | 添加用户 |
| DELETE | /api/xueqiu/users/:userId | 删除用户 |
| GET | /api/xueqiu/user/:userId | 获取用户时间线 |
| GET | /api/xueqiu/user/:userId/info | 获取用户信息 |
| GET | /api/xueqiu/saved/:userId | 获取已保存的帖子 |
| GET | /api/xueqiu/sync | 手动触发同步 |
| GET | /api/xueqiu/health | 健康检查 |

## 数据库表

### xueqiu_users - 用户表

```sql
CREATE TABLE xueqiu_users (
  id BIGINT PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  screen_name TEXT,
  profile_image_url TEXT,
  description TEXT,
  followers_count INTEGER DEFAULT 0,
  friends_count INTEGER DEFAULT 0,
  statuses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_xueqiu_users_user_id ON xueqiu_users(user_id);
```

### xueqiu_posts - 帖子表

```sql
CREATE TABLE xueqiu_posts (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  user_screen_name TEXT,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  reposts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  source TEXT
);

CREATE INDEX idx_xueqiu_posts_user_id ON xueqiu_posts(user_id);
```

## 前端页面

| 路径 | 说明 |
|------|------|
| /xueqiu | 雪球发言列表页 |
| /xueqiu/settings | 雪球用户管理页 |

## 多用户支持

- 使用 `xueqiu_users` 表存储用户信息
- 后台每 10 秒自动同步所有用户的帖子
- 设置页表格展示：用户ID、用户名（screen_name）、帖子数

## 请求参数

- `userId`: 雪球用户ID（数字或用户名）
- `page`: 页码（默认1）
- `type`: 类型（1=全部, 2=问答, 4=原创）

## 雪球 API

```
# 用户时间线
GET https://xueqiu.com/statuses/user_timeline.json?user_id={ID}&page={page}&type={type}

# 用户信息
GET https://xueqiu.com/v4/users/{id}
```

## 实现方案

### Playwright 配置

```javascript
import { chromium } from 'playwright';

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
  }
  return browser;
}
```

### Cookie 设置

使用 Playwright 的 `addCookies` 方法，domain 为 `xueqiu.com`（不是 `.xueqiu.com`）：

```javascript
await context.addCookies([{
  name: 'xq_a_token',
  value: cookie,
  domain: 'xueqiu.com',
  path: '/'
}]);
```

### 关键实现

1. **直接调用 API**: 雪球的 `/statuses/user_timeline.json` API 可以直接获取数据
2. **使用 Playwright 绕过反爬**: 通过无头浏览器发送请求，带上 Cookie
3. **后台同步**: 每 10 秒自动同步一次帖子到数据库

```javascript
async function getUserTimeline(userId, page = 1, type = 1) {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
  });
  const page2 = await context.newPage();

  // 设置 Cookie
  const cookie = await getCookie();
  await context.addCookies([{
    name: 'xq_a_token',
    value: cookie,
    domain: 'xueqiu.com',
    path: '/'
  }]);

  // 直接访问 API
  const apiUrl = `https://xueqiu.com/statuses/user_timeline.json?user_id=${userId}&page=${page}&type=${type}`;
  const response = await page2.goto(apiUrl, {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  const json = await response.json();

  await page2.close();
  await context.close();
  return json;
}
```

### 后台同步服务

```javascript
// backend/src/services/xueqiuSync.js
export function startXueqiuSync(intervalMs = 10000) {
  if (syncInterval) return;

  console.log(`启动雪球帖子同步任务，间隔 ${intervalMs / 1000} 秒`);

  // 立即执行一次
  syncXueqiuPosts();

  // 设置定时任务
  syncInterval = setInterval(syncXueqiuPosts, intervalMs);
}
```

在 `backend/src/index.js` 中启动：

```javascript
import { startXueqiuSync } from './services/xueqiuSync.js';
startXueqiuSync(10000); // 每 10 秒同步一次
```

## 获取 Cookie 方法

1. 浏览器登录 xueqiu.com
2. F12 打开开发者工具
3. Application → Cookies → xueqiu.com
4. 复制 `xq_a_token` 的值

## 配置

```env
# backend/.env
XUEQIU_COOKIE=your_xq_a_token_here
```

## 测试结果

- 用户ID `7433300125` (寻瑕记) - ✅ 成功返回 20 条发言
- 分页功能正常：maxPage=10

## 常见问题

### 1. 返回空数据
- 原因：用户没有发言、隐私设置、或 Cookie 权限不足
- 解决：检查 Cookie 是否有效，尝试其他用户

### 2. 403 Forbidden
- 原因：IP 被封禁或 Cookie 过期
- 解决：更新 Cookie，使用代理 IP

### 3. Playwright Chromium 未安装
- 解决：运行 `npx playwright install chromium`

### 4. Cookie 域名校验失败
- 解决：domain 使用 `xueqiu.com`（不带点号），path 设为 `/`

## 后续优化

- [ ] 支持缓存机制减少请求
- [ ] 添加代理池轮换 IP
- [ ] 支持更多用户类型（组合 ID 等）
- [ ] 优化图片加载
