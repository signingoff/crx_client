# X For You

在本地浏览器中查看 X.com (Twitter) For You 推荐流，支持自动刷新和内容过滤。

![技术栈](https://img.shields.io/badge/前端-Vue%203%20%2B%20Vite-green)
![技术栈](https://img.shields.io/badge/后端-Node.js%20%2B%20Express-blue)

## 功能特点

- 📰 **实时更新** - 自动获取最新推荐内容，15秒刷新一次
- 🚫 **内容过滤** - 自动屏蔽日语推文和黑名单用户
- 🔄 **转发展示** - RT 推文嵌套显示原推文内容（类似 x.com）
- 🖼️ **媒体展示** - 图片网格布局，点击放大；视频/GIF 点击跳转观看
- 📱 **响应式设计** - 适配桌面和移动设备（800px 宽布局）
- 🔧 **易于配置** - 简单的环境变量设置
- ⚡ **快捷操作** - 推文右上角"..."菜单支持拉黑用户

## 快速开始

### 1. 获取 X.com Cookie

1. 用浏览器登录 https://x.com
2. 按 F12 打开开发者工具 → **Application** → **Storage** → **Cookies**
3. 复制以下两个值：
   - `auth_token`
   - `ct0`

### 2. 安装和启动

```bash
# 1. 克隆项目
git clone <项目地址>
cd xueqiu_crx

# 2. 启动后端
cd backend
npm install
cp .env.example .env
# 编辑 .env，填入 auth_token 和 ct0
npm run dev

# 3. 启动前端（新终端）
cd frontend
npm install
npm run dev
```

4. 打开浏览器访问 http://localhost:5173

## 使用说明

### 黑名单管理

通过 API 添加用户到黑名单：

```bash
# 按用户名屏蔽
curl -X POST http://localhost:3000/api/tweets/blacklist \
  -H "Content-Type: application/json" \
  -d '{"username": "exampleuser"}'

# 按用户ID屏蔽
curl -X POST http://localhost:3000/api/tweets/blacklist \
  -H "Content-Type: application/json" \
  -d '{"userId": "123456789"}'
```

黑名单配置保存在 `backend/src/config/blacklist.json`。

### 界面操作

- **图片** - 点击放大查看，再次点击关闭
- **视频/GIF** - 点击跳转到原推文页面观看
- **自动刷新** - 页面顶部显示更新状态，新推文自动插入顶部
- **拉黑用户** - 点击推文右上角"..."菜单，选择"拉黑"

## 项目结构

```
xueqiu_crx/
├── backend/          # Node.js 后端服务
│   ├── src/config/   # 配置文件
│   ├── src/routes/   # API 路由
│   └── src/services/ # X API 服务
├── frontend/         # Vue 3 前端
│   └── src/components/
└── CLAUDE.md         # 开发文档
```

## 注意事项

1. **Cookie 有效期** - X.com 的 cookie 会定期过期，需要重新获取
2. **Query ID 更新** - 如果提示 "Query not found"，需要从浏览器开发者工具抓取新的 Query ID
3. **使用限制** - 过于频繁的请求可能导致账号被限制，建议保持默认 15 秒刷新间隔

## 技术栈

- **前端**: Vue 3 + Vite
- **后端**: Node.js + Express
- **数据源**: X.com GraphQL API

## 许可证

MIT
