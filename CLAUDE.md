# X For You - Claude 上下文

## 项目目标

获取 X.com For You 页面内容，在个人本地环境展示，支持内容过滤和自动刷新。

**核心设计理念**:
- 隐私优先：数据本地处理，不依赖第三方服务
- 轻量级：前后端分离，快速启动
- 可定制：黑名单、语言过滤等可配置

## 架构决策

### 技术选型原因

| 技术 | 原因 |
|------|------|
| Vue 3 + Vite | 响应式、快速热更新、Composition API 逻辑复用 |
| Node.js + Express | X API 需要 Cookie 认证，Node 易于处理 HTTP 请求 |
| 直接调用 X GraphQL | 不依赖官方 API（付费/限制），通过 Cookie 获取完整内容 |

### 关键设计

1. **后端过滤逻辑**
   - 日语过滤：后端进行，减少前端负担
   - 黑名单过滤：后端进行，保护用户不必看到已屏蔽内容
   - 原因：过滤逻辑统一在后端，前端只负责展示

2. **自动刷新机制**
   - 间隔：15秒（平衡实时性和 API 限制）
   - 防缓存：URL 加时间戳参数
   - 新推文处理：直接插入列表顶部，无提示条（简化交互）

3. **媒体处理策略**
   - 图片：本地展示 + Lightbox
   - 视频/GIF：跳转原推文（避免 referer 问题）
   - 原因：X 的视频需要 referer/cookie 才能直接播放

## 代码规范

### 文件组织

```
backend/src/
├── config/          # 配置项（可编辑的 JSON/JS）
├── routes/          # API 路由定义
├── services/        # 业务逻辑（X API 调用）
└── index.js         # 入口

frontend/src/
├── components/      # Vue 组件
├── views/           # 页面级组件
├── api/             # 前端 API 封装
└── App.vue          # 根组件
```

### 命名约定

- 组件：PascalCase（`TweetCard.vue`）
- 工具函数：camelCase（`isJapaneseText`）
- API 端点：kebab-case（`/for-you`）
- 配置文件：小写（`blacklist.json`）

### 错误处理

- 后端：统一返回 `{ success: boolean, data/error }` 格式
- 前端：API 层捕获，视图层显示友好错误信息

## 配置文件

### 黑名单配置
**文件**: `backend/src/config/blacklist.json`

```json
{
  "users": ["用户ID1"],
  "usernames": ["用户名1"]
}
```

### Cookie 配置
**文件**: `backend/.env`

```env
X_AUTH_TOKEN=xxx
X_CT0=xxx
```

**更新时机**: 当 API 返回 401/403 或无法获取数据时

### Query ID 更新
**文件**: `backend/src/services/xService.js`

当遇到 "Query not found" 错误时：
1. 打开 x.com → F12 → Network
2. 找到 HomeTimeline 请求
3. 提取 Query ID（URL 中的 `graphql/QUERY_ID/HomeTimeline`）

## 待办事项

### 高优先级
- [ ] RT 嵌套显示原推文内容
- [ ] 推文卡片右上角 "..." 菜单（拉黑操作）
- [ ] 加大推文卡片宽度
- [ ] 新推文自动插入列表（移除提示条）

### 中优先级
- [ ] 视频直接播放（探索代理方案）
- [ ] 推文详情页
- [ ] 用户个人页

### 技术债务
- [ ] 添加 TypeScript 类型定义
- [ ] 添加单元测试
- [ ] 前端状态管理（Pinia）

## 常见问题

### 视频无法播放
**原因**: X API 的视频 URL 需要 referer
**解决**: 改为缩略图 + 跳转链接（当前方案）

### Cookie 过期
**现象**: API 返回 401 或空数据
**解决**: 重新从浏览器获取 auth_token 和 ct0

### 获取不到新推文
**检查**:
1. Query ID 是否过期
2. Cookie 是否有效
3. 网络连接

## 扩展指南

### 添加新的过滤器

**后端** `backend/src/services/xService.js`:
```javascript
function isXXXFilter(text) {
  return text.includes('xxx');
}

// 在 getForYouTweets 中添加过滤
tweets.filter(tweet => !isXXXFilter(tweet.text));
```

### 添加新的 API 端点

**后端** `backend/src/routes/tweets.js`:
```javascript
router.get('/new-endpoint', async (req, res) => {
  // 实现
});
```

**前端** `frontend/src/api/tweets.js`:
```javascript
export async function newApiCall() {
  // 封装
}
```

## 依赖关系

```
frontend
  → backend API
    → X.com GraphQL API (需要 Cookie)
    → blacklist.json (本地配置)
```

## 性能考虑

- 自动刷新 15 秒间隔（避免触发 X 速率限制）
- 图片懒加载（减少初始加载时间）
- 后端过滤减少数据传输

---

**Skills 文档**: [.claude/skills/](./.claude/skills/)
