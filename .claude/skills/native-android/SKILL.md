---
name: Android 原生功能
description: X For You Android 开发指南 - Kotlin + Jetpack Compose
version: 1.0.0
---

# Android 原生应用开发指南

## 核心索引 (References)
- **后端 API 详情**: [architecture.md](@file:../../architecture.md)
- **核心逻辑说明**: [features.md](@file:../../features.md)

## 技术选型
- **Runtime**: JVM / Android SDK 33+
- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Network**: Retrofit + OkHttp
- **Persistence**: DataStore (用于 Token 存储)

## 目录结构
- `android-native/app/src/main/java/.../ui/`: 包含所有 Compose 视图（如 `HomeScreen`, `UserSettingsScreen`）。
- `android-native/app/src/main/java/.../data/`: 包含 Repository 与 API 定义。

## 关键功能实现
- **登录同步**: 原生端通过 JWT Token 与后端进行身份验证。
- **混合流**: 实现了与 Web 端一致的混合推文展示逻辑。
- **离线能力**: 推文状态会在本地缓存，提升首屏加载速度。

## 开发调试
- 使用 Android Studio 打开 `android-native` 目录。
- 构建命令: `./gradlew assembleDebug`。
