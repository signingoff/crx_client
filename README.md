# X For You

在本地浏览器中查看 X.com (Twitter) Following 流 + 雪球网帖子，按时间倒排混合展示，支持自动刷新和内容过滤。

![技术栈](https://img.shields.io/badge/前端-Vue%203%20%2B%20Vite-green)
![技术栈](https://img.shields.io/badge/后端-Node.js%20%2B%20Express-blue)
![数据库](https://img.shields.io/badge/数据库-Supabase-green)

## 功能特点

- 📰 **混合信息流** - Twitter Following 推文 + 雪球网帖子按时间倒排混合展示
- 🔄 **自动同步** - Twitter 每 2 分钟同步，雪球每 5 分钟同步，前端每 8 秒轮询
- 🚫 **内容过滤** - 自动屏蔽日语、韩语推文
- 🖼️ **媒体展示** - 图片网格布局，点击放大；视频/GIF 点击跳转观看
- 👥 **用户监控** - 监控指定的雪球用户和 Twitter 用户（支持 @handle 输入）
- 🔗 **来源感知** - 雪球帖子显示 ❄️ 并跳转雪球，X 推文跳转 x.com
- 🔧 **Query ID 管理** - 手动配置 X GraphQL Query ID

## 快速开始

### 1. 获取认证信息

**X.com Cookie**:
1. 用浏览器登录 https://x.com
2. 按 F12 打开开发者工具 → **Application** → **Storage** → **Cookies**
3. 复制 `auth_token` 和 `ct0`
4. Network 标签中找任意 X API 请求，复制 `authorization` 头（去掉 `Bearer ` 前缀）

**雪球 Cookie**（可选）:
1. 登录 https://xueqiu.com
2. 复制 `xq_a_token` Cookie 值

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

### 3. 编译 Android 应用（可选）

**环境要求**:
- Android Studio Hedgehog (2023.1.1) 或更高版本
- JDK 17
- Android SDK 34

**编译步骤**:

```bash
# 1. 使用 Android Studio 打开项目
cd android-native
# 或在 Android Studio 中选择 File → Open → android-native 目录

# 2. 命令行编译
./gradlew assembleDebug        # 编译 Debug APK
./gradlew assembleRelease      # 编译 Release APK
```

**输出位置**:
- Debug: `android-native/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android-native/app/build/outputs/apk/release/app-release-unsigned.apk`

**发布到设备**:

```bash
# 安装 Debug 版本到连接的设备
./gradlew installDebug

# 或使用 adb
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Android 应用功能**:
- 混合信息流（Twitter + 雪球）
- 下拉刷新 + 滚动加载更多
- 图片 Lightbox（双指缩放）
- 底部导航栏（首页/用户/设置）
- 登录认证（JWT Token）

## 使用说明

### 界面操作

- **图片** - 点击放大查看，再次点击关闭
- **视频/GIF** - 点击跳转到原推文页面观看
- **自动刷新** - 页面顶部显示更新状态，新推文自动插入顶部

## 项目结构

```
xueqiu_crx/
├── backend/              # Node.js 后端服务
│   ├── src/
│   │   ├── config/       # 配置文件（Query ID 等）
│   │   ├── routes/       # API 路由（twitter, xueqiu, auth）
│   │   ├── services/     # 同步服务（Twitter, 雪球抓取）
│   │   └── db/           # 数据库操作（Supabase/SQLite）
│   └── .env              # 环境变量配置
├── frontend/             # Vue 3 前端
│   ├── src/
│   │   ├── api/          # API 请求封装
│   │   ├── components/   # UI 组件（TweetCard, TweetList）
│   │   ├── views/        # 页面视图（Home, UserSettings）
│   │   └── router/       # 路由配置
│   └── .env              # 环境变量配置
├── android-native/       # Android 原生应用（Kotlin + Jetpack Compose）
├── .claude/skills/       # Claude Code Skill 文档
├── docs/                 # 设计文档和架构说明
└── CLAUDE.md             # 开发文档
```

## 注意事项

1. **Cookie 有效期** - X.com 和雪球的 Cookie 会定期过期，需要重新获取
2. **Query ID 更新** - 如果推文获取失败，在设置面板手动更新 Query ID
3. **UserByScreenName Query ID** - 仅在访问 X.com 用户主页时出现，需手动从 Network 抓取后填入设置
4. **使用限制** - 过于频繁的请求可能导致账号被限制，建议保持默认同步间隔

## 技术栈

| 平台 | 技术 | 部署/构建 |
|------|------|----------|
| **前端** | Vue 3 + Vite | Vercel |
| **后端** | Node.js + Express | Render |
| **数据库** | Supabase (PostgreSQL) | - |
| **Android** | Kotlin + Jetpack Compose | APK / Google Play |
| **数据源** | X.com GraphQL API + 雪球网 API | - |

## 许可证

MIT
