---
name: 前端功能
description: X For You 前端功能说明 - Vue 3 + Vite 技术栈
---

# 前端功能

## 技术栈
- Vue 3 (Composition API)
- Vite
- Axios

## 核心功能

### 1. 推文展示
**文件**: `frontend/src/components/TweetCard.vue`

- 作者信息：头像、名称、用户名
- 推文内容：高亮话题标签 # 和提及 @
- 相对时间显示（刚刚、X分钟前、X小时前、X天前）
- 互动指标：回复、转发、点赞、浏览量

#### RT（转发）嵌套显示
- 转发推文显示转发者名称（🔄 xxx 转发了）
- 显示原推文作者信息
- 解析 RT @username: content 格式，提取原推文内容

#### 长推文（Show more/Show less）
- 超过 280 字符的长推文显示 "Show more" 按钮
- 默认折叠显示前 280 字符 + "..."
- 点击展开显示完整文本，按钮变为 "Show less"
- 依赖后端 `isLongText` 标记识别长推文

#### 拉黑菜单
**文件**: `frontend/src/components/TweetCard.vue`

实现细节：
- 右上角 "⋯" 按钮，点击展开下拉菜单
- 菜单项："🚫 拉黑 @username"（红色警示文字）
- 点击外部区域自动关闭菜单（使用 `v-click-outside` 指令）
- 调用 API 成功后：
  1. 显示成功提示
  2. 触发 `block-user` 事件通知父组件
  3. 父组件从列表中过滤该用户所有推文

事件流：
```
TweetCard → @block-user → TweetList → @block-user → HomeView → filter tweets
```

**HomeView.vue 处理逻辑**:
```javascript
function handleBlockUser(username) {
  // 拉黑后从列表中移除该用户的推文
  tweets.value = tweets.value.filter(t => t.author.username !== username)
}
```

#### 布局
- 卡片宽度：800px（已从 600px 加宽）
- 圆角边框、阴影效果


### 2. 媒体处理
**文件**: `frontend/src/components/TweetCard.vue`

#### 静态图片
- 网格布局自适应（1-4张不同排列）
- 点击放大查看（Lightbox）
- 再次点击或关闭按钮退出
- 懒加载优化

#### 视频/GIF
- 显示缩略图 + 播放按钮
- 点击跳转到 X 原推文观看
- GIF 标识标签

#### 布局规则
| 图片数量 | 布局方式 |
|---------|---------|
| 1张 | 全宽展示 |
| 2张 | 等分两列 |
| 3张 | 首图跨两列，下面两张并排 |
| 4张 | 2x2 标准网格 |

### 3. 自动刷新
**文件**: `frontend/src/views/HomeView.vue`

- 刷新间隔：15秒
- 防缓存机制：URL 添加 `?t=时间戳` 参数
- 新推文检测：与现有推文对比 ID
- 新推文自动插入列表顶部（无需点击提示条）
- UI 效果：
  - 顶部"更新中..."动画指示器
  - 显示最后更新时间（精确到秒）
- 已移除手动刷新按钮、新推文提示条

### 4. 双栏布局（推文列表 + X.com 嵌入预览）
**文件**: `frontend/src/views/HomeView.vue`

布局结构：
```
┌─────────────────┬──────────────────────────────┐
│                 │                              │
│   左侧推文列表   │      右侧 X.com iframe       │
│   (400px 固定)  │      (自适应宽度)             │
│                 │      显示原始推文页面         │
│                 │      通过 Chrome 扩展隐藏导航 │
└─────────────────┴──────────────────────────────┘
```

功能：
- 点击左侧推文卡片，右侧 iframe 加载对应 X.com 推文页面
- 选中推文显示蓝色边框高亮
- 依赖 Chrome Extension 移除 `X-Frame-Options` 限制
- Content Script 隐藏 x.com 的 header 和侧边栏

### 5. Chrome Extension（iframe 支持）
**文件**: `frontend/public/manifest.json`, `rules.json`, `content-script.js`

**安装方式**：
1. 打开 Chrome 扩展管理页 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `frontend/public` 目录

**功能**：
- `rules.json` - 使用 `declarativeNetRequest` API 移除 `X-Frame-Options` 和 `Content-Security-Policy` 响应头
- `content-script.js` - 隐藏 X.com 的 header、侧边栏，调整布局

**原理**：
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  前端页面   │────▶│  Chrome扩展 │────▶│   x.com     │
│  iframe请求 │     │ 修改响应头   │     │ 返回页面    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 关键配置

### 双栏布局样式
**文件**: `frontend/src/views/HomeView.vue`
```css
.home {
  display: flex;
  height: 100vh;
}

.left-panel {
  width: 400px;
  min-width: 400px;
  border-right: 1px solid #e1e8ed;
}

.right-panel {
  flex: 1;
  background: #fff;
  overflow-y: auto;
}
```

## 前端 API 调用
**文件**: `frontend/src/api/tweets.js`

### 获取推文
```javascript
// 获取推文（自动添加时间戳防缓存）
GET http://localhost:3000/api/tweets/for-you?count=20&t=123456789
```

### 拉黑用户
```javascript
// 前端拉黑用户（通过"..."菜单调用）
POST http://localhost:3000/api/tweets/blacklist
Content-Type: application/json

{
  "username": "targetuser"  // 或 userId: "123456789"
}
```

## 组件结构
```
frontend/src/
├── components/
│   ├── TweetCard.vue      # 单条推文卡片（支持点击选中）
│   └── TweetList.vue      # 推文列表容器
├── views/
│   └── HomeView.vue       # 双栏布局主页面（左列表 + 右iframe）
├── api/
│   └── tweets.js          # API 请求封装
└── App.vue                # 根组件

frontend/public/           # Chrome Extension 文件
├── manifest.json          # 扩展配置（声明式网络请求规则）
├── rules.json             # 网络请求规则（移除 X-Frame-Options）
└── content-script.js      # 内容脚本（隐藏 x.com UI）
```

## 关键配置

### 自动刷新间隔
**文件**: `frontend/src/views/HomeView.vue`
```javascript
// 第 87 行
refreshInterval = setInterval(loadTweets, 15000)  // 15秒
```

### CORS 配置
后端支持的前端端口：`5173`, `5174`, `5175`
