# Android App 包装器设计方案

## 概述
使用 Capacitor 将现有的 Vue 3 前端项目包装为 Android APK，用于个人日常使用。

## 设计目标
- 最小化改动现有前端代码
- 零离线缓存，每次打开重新加载
- 后端连接由前端页面自行处理
- 生成可安装的 APK 文件

## 技术选型

| 技术 | 版本 | 原因 |
|------|------|------|
| Capacitor | ^5.0 | Vue 3 + Vite 项目友好，配置简单 |
| Android SDK | API 26+ | 支持 Android 8.0+ |
| Android Studio | 最新版 | 用于打包 APK |

## 项目结构

```
xueqiu_crx/
├── frontend/                    # 现有 Vue 项目
│   ├── capacitor.config.json    # Capacitor 配置
│   └── android/                 # 生成的 Android 项目（自动生成）
└── docs/
    └── plans/
        └── 2026-03-06-android-wrapper-design.md  # 本文档
```

## 功能范围

### 包含功能
- WebView 全屏显示前端页面
- 返回键处理：网页内返回优先，首页再退出 App
- 外部链接跳转系统浏览器
- 基础启动画面

### 不包含功能
- 推送通知
- 离线缓存
- 原生分享
- 相机/麦克风访问
- 本地存储

## WebView 配置

```javascript
// capacitor.config.json
{
  "appId": "com.xueqiu.xforyou",
  "appName": "X For You",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#ffffff"
    }
  }
}
```

## 权限需求

仅需要 `INTERNET` 权限，用于加载前端页面和 API 请求。

## 构建输出

| 类型 | 路径 | 用途 |
|------|------|------|
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` | 本地测试 |
| Release APK | `android/app/build/outputs/apk/release/app-release-unsigned.apk` | 需签名后安装 |

## 注意事项

1. 首次打包需要 Android Studio 配置 SDK
2. Debug APK 可直接安装，Release APK 需要签名
3. 前端页面负责所有业务逻辑，包括后端 API 调用
4. 不提交生成的 `android/` 目录到 git，通过 `capacitor.config.json` 重新生成

## 相关文档

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Android 打包指南](https://capacitorjs.com/docs/android)
