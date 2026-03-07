# 前端架构详解

## 目录结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API 请求封装
│   │   ├── tweets.js      # 推文/Query ID API
│   │   └── xueqiu.js      # 雪球 API
│   ├── components/        # Vue 组件
│   │   ├── TweetCard.vue
│   │   ├── TweetList.vue
│   │   └── QueryIdSettings.vue
│   ├── views/             # 页面视图
│   │   ├── HomeView.vue
│   │   └── UserSettingsView.vue
│   ├── router/            # 路由配置
│   │   └── index.js
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── index.html
├── package.json
└── vite.config.js
```

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | ^3.3.0 | 框架 |
| Vite | ^5.0.0 | 构建工具 |
| Vue Router | ^4.0.0 | 路由 |
| Axios | ^1.6.0 | HTTP 客户端 |

## 首页聚合关键约束

- **去重规则**: 在 `HomeView.vue` 中必须使用 `source:id` 作为聚合流去重键，而不是仅使用 `id`。
- **适用范围**: 初次加载、自动刷新 `pendingTweets`、分页追加三条路径都要复用同一去重键函数（如 `getFeedItemKey()`）。
- **目的**: 防止 Twitter 与雪球在数值 `id` 相同的情况下互相覆盖。

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `TweetCard.vue` |
| 组合式函数 | camelCase | `useTweets.js` |
| API 函数 | camelCase | `fetchTwitterPosts` |

## 样式组织

全局样式在 `App.vue` 中定义：

```css
/* 滚动条 */
::-webkit-scrollbar {
  width: 8px;
}

/* 颜色变量 */
:root {
  --color-primary: #1d9bf0;
  --color-text: #0f1419;
  --color-text-secondary: #536471;
}
```

组件样式使用 scoped：

```vue
<style scoped>
.tweet-card {
  padding: 16px;
}
</style>
```
