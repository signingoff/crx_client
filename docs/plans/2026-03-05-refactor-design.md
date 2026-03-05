# 重构设计：5 项变更

**日期**: 2026-03-05

---

## 变更列表

### 1. 删除 Tweet Metrics

`TweetCard.vue` 中删除 `.tweet-metrics` div（💬 🔄 ❤️）及对应 CSS，无其他依赖。

---

### 2. 删除 /xueqiu 路由及对应后端 API

**前端删除**：
- `frontend/src/views/XueqiuView.vue`
- `frontend/src/views/XueqiuUserView.vue`
- `frontend/src/router/index.js` 中移除路由 `/xueqiu`、`/xueqiu/user/:userId`

**后端删除**：
- `GET /api/xueqiu/saved/:userId`（仅被 XueqiuUserView 调用）

**保留**（仍被 HomeView / Settings 使用）：
- `GET /api/xueqiu/posts`
- `GET /api/xueqiu/users`
- `POST /api/xueqiu/users`
- `DELETE /api/xueqiu/users/:userId`
- `POST /api/xueqiu/posts/:id/read`

---

### 3. /xueqiu/settings → /user_settings，Settings 链接迁移到首页

- 路由：`/xueqiu/settings` → `/user_settings`
- `XueqiuSettingsView.vue` → 重命名为 `UserSettingsView.vue`（同时承载第 5 条的 Twitter 用户管理区块）
- 首页 header：移除 ❄️ 导航链接，改为 `👥` 超链接跳到 `/user_settings`
- 现有 🔧 按钮（QueryId 设置）保留不动

---

### 4. 聚合 For You 开关

**数据库**：
```sql
-- twitter_posts 新增字段
ALTER TABLE twitter_posts ADD COLUMN IF NOT EXISTS is_for_you BOOLEAN DEFAULT FALSE;

-- settings 表新增条目
INSERT INTO settings (key, value, description)
VALUES ('for_you_only', 'false', '首页只展示 For You 推文')
ON CONFLICT (key) DO NOTHING;
```

**后端**：
- `twitterSync.js`：For You 推文保存时带 `is_for_you: true`，Following 推文带 `is_for_you: false`
- `supabase.js` `getAllTwitterPosts(page, limit, forYouOnly)`：当 `forYouOnly=true` 时加 `.eq('is_for_you', true)` 过滤
- `routes/twitter.js` GET `/posts`：读取 `forYouOnly` 查询参数并透传

**前端** (`HomeView.vue`)：
- 挂载时调 `/api/settings-db/for_you_only` 读取当前值
- Header 加 toggle 开关（默认关闭）
- 切换时：写入 settings API + 重新拉取帖子

---

### 5. Twitter 用户监控

**数据库（新表）**：
```sql
CREATE TABLE tweet_users (
  user_id TEXT PRIMARY KEY,
  screen_name TEXT,
  profile_image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
> `description` 存用户 bio，在新增用户时通过 X API 拉取并写入。

**后端新增**：
- `supabase.js`：新增 `getTweetUsers / saveTweetUser / deleteTweetUser` 函数
- `services/twitterUserSync.js`：参考 `xueqiuSync.js`，遍历 `tweet_users`，调用 X API 获取各用户 timeline，存入 `twitter_posts`（`is_for_you: false`）
- `routes/twitter.js` 新增：
  - `GET /api/twitter/users`
  - `POST /api/twitter/users`（新增用户时同步拉取 profile 写入 user_id/screen_name/profile_image_url/description）
  - `DELETE /api/twitter/users/:userId`

**前端** (`UserSettingsView.vue`)：
- 在现有雪球用户管理区块下方新增「Twitter 用户监控」区块，UI 结构相同（输入 user_id → 添加 → 列表展示 → 可删除）

---

## 关键文件汇总

| 文件 | 变更 |
|------|------|
| `frontend/src/components/TweetCard.vue` | 删除 metrics |
| `frontend/src/views/XueqiuView.vue` | 删除 |
| `frontend/src/views/XueqiuUserView.vue` | 删除 |
| `frontend/src/views/XueqiuSettingsView.vue` | 重命名为 UserSettingsView.vue，新增 Twitter 用户区块 |
| `frontend/src/router/index.js` | 删除旧路由，新增 /user_settings |
| `frontend/src/views/HomeView.vue` | 替换 ❄️ 为 👥 链接，加 For You toggle |
| `backend/src/db/supabase.js` | getAllTwitterPosts 加 forYouOnly 参数，新增 tweet_users CRUD |
| `backend/src/services/twitterSync.js` | 标记 is_for_you |
| `backend/src/services/twitterUserSync.js` | 新建，参考 xueqiuSync.js |
| `backend/src/routes/twitter.js` | 新增 /users 端点，GET /posts 支持 forYouOnly |
| `backend/src/routes/xueqiu.js` | 删除 /saved/:userId |
