# X For You - Electron Desktop App

Electron 桌面应用版本，无需 Chrome Extension 即可嵌入 X.com 内容。

## 特性

- ✅ 无需浏览器扩展 - Electron 自动处理 X-Frame-Options
- ✅ 自动启动后端服务 - 一键运行前后端
- ✅ 单包安装 - 用户只需安装一个应用
- ✅ 跨平台 - 支持 Windows、macOS、Linux

## 开发

### 安装依赖

```bash
# 在项目根目录
npm install

# 同时安装前后端依赖
cd backend && npm install
cd ../frontend && npm install
```

### 开发模式

```bash
# 同时启动后端 + 前端 + Electron
npm run dev
```

这会自动：
1. 启动后端服务 (localhost:3000)
2. 启动前端开发服务器 (localhost:5173)
3. 等待前端就绪后启动 Electron

### 构建

```bash
# 构建前端
npm run build

# 打包 Electron 应用（所有平台）
npm run dist

# 仅打包 Windows
npm run dist:win

# 仅打包 macOS
npm run dist:mac

# 仅打包 Linux
npm run dist:linux
```

打包后的应用位于 `dist-electron` 目录。

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron 主进程 (main.js)                  │
│  - 创建 BrowserWindow                                        │
│  - 拦截请求移除 X-Frame-Options                              │
│  - 启动后端 Node.js 服务                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 加载
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Electron 渲染进程 (Vue 前端)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TweetList (左侧面板)                                 │  │
│  │  - 显示推文列表                                       │  │
│  │  - 调用后端 API                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           │ 点击推文                        │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Webview 标签 (右侧面板)                              │  │
│  │  - 嵌入 x.com/i/web/status/{id}                       │  │
│  │  - 无需 Extension，Electron 自动处理 X-Frame-Options   │  │
│  │  - 通过 preload 脚本隐藏 header/sidebar               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP 请求
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              后端服务 (Node.js + Express，内嵌)               │
│  - /api/for-you (获取推文)                                  │
│  - 复用现有 backend 代码                                    │
└─────────────────────────────────────────────────────────────┘
```

## 文件结构

```
xueqiu_crx/
├── backend/              # 后端服务
├── frontend/             # Vue 前端
├── electron/             # Electron 相关文件
│   ├── main.js          # 主进程入口
│   ├── preload.js       # 预加载脚本（渲染进程）
│   └── webview-preload.js # webview 预加载脚本（x.com）
├── build/               # 构建资源（图标等）
├── package.json         # 根目录 package.json
└── electron-builder.json # 打包配置
```

## 关键实现

### 移除 X-Frame-Options

Electron 主进程中拦截响应头：

```javascript
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  const headers = details.responseHeaders;
  Object.keys(headers).forEach(key => {
    if (key.toLowerCase() === 'x-frame-options') {
      delete headers[key];
    }
    if (key.toLowerCase() === 'content-security-policy') {
      delete headers[key];
    }
  });
  callback({ responseHeaders: headers });
});
```

### 隐藏 X.com UI

`webview-preload.js` 在 webview 中执行，注入 CSS 隐藏 header 和 sidebar。

### 环境检测

前端通过 `window.electronAPI.isElectron` 检测是否在 Electron 环境中运行。

## 注意事项

1. **Cookie/登录**：用户需要手动登录 X.com，Electron 会保存 cookies
2. **自动更新**：可以配置 electron-builder 的 publish 功能实现自动更新
3. **图标**：打包前需要添加应用图标到 `build/` 目录

## 与 Chrome Extension 方案对比

| 维度 | Chrome Extension | Electron |
|------|------------------|----------|
| 安装方式 | 需安装 Extension + 打开网页 | 单包安装（.exe/.dmg） |
| X-Frame-Options | Extension 移除 | Electron 直接忽略 |
| 后端服务 | 需单独启动 | Electron 自动启动 |
| Cookie/登录 | 复用浏览器登录状态 | 需在 Electron 中登录 |
| 资源占用 | 低（复用浏览器） | 中（内置 Chromium） |
| 打包大小 | N/A | ~150MB |
| 自动更新 | Chrome Web Store | electron-builder 支持 |
| 跨平台 | 是 | 是 |
