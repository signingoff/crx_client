# Android App 包装器实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 使用 Capacitor 将现有 Vue 3 前端项目包装为 Android APK

**架构:** 在现有 frontend 目录添加 Capacitor 配置，生成 Android Studio 项目，配置 WebView 全屏和返回键处理，最终打包为可安装的 APK 文件

**Tech Stack:** Capacitor 5, Android SDK, Android Studio

---

## 前置要求检查

- Node.js 18+ 已安装
- Android Studio 已安装（用于打包 APK）
- 前端项目能正常构建 (`npm run build`)

---

## 任务列表

### Task 1: 安装 Capacitor 依赖

**目标:** 在 frontend 目录安装 Capacitor 核心依赖

**Files:**
- Modify: `frontend/package.json`

**Step 1: 安装依赖**

```bash
cd D:/xueqiu_crx/frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
```

**Step 2: 验证安装**

Run: `npx cap --version`
Expected: 显示版本号如 5.x.x

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Capacitor dependencies for Android"
```

---

### Task 2: 创建 Capacitor 配置文件

**目标:** 创建 capacitor.config.json 配置 App 信息和 WebView 设置

**Files:**
- Create: `frontend/capacitor.config.json`

**Step 1: 编写配置文件**

```json
{
  "appId": "com.xueqiu.xforyou",
  "appName": "X For You",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "cleartext": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#ffffff",
      "androidSplashResourceName": "splash"
    }
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true
  }
}
```

**Step 2: 验证 JSON 格式**

Run: `cat capacitor.config.json | npx jsonlint`
Expected: 无错误输出

**Step 3: Commit**

```bash
git add capacitor.config.json
git commit -m "chore: add Capacitor configuration"
```

---

### Task 3: 构建前端项目

**目标:** 生成生产环境构建文件到 dist 目录

**Files:**
- Modify: `frontend/dist/` (生成的文件)

**Step 1: 执行构建**

```bash
cd D:/xueqiu_crx/frontend
npm run build
```

**Step 2: 验证构建输出**

Run: `ls -la dist/`
Expected: 存在 index.html 和 assets/ 目录

**Step 3: Commit（dist 是否提交由用户决定，默认不提交）**

---

### Task 4: 初始化 Android 项目

**目标:** 使用 Capacitor CLI 生成 Android Studio 项目

**Files:**
- Create: `frontend/android/` 整个目录

**Step 1: 添加 Android 平台**

```bash
cd D:/xueqiu_crx/frontend
npx cap add android
```

**Step 2: 验证项目生成**

Run: `ls android/app/src/main/`
Expected: 存在 AndroidManifest.xml, java/, res/

**Step 3: 同步 Web 资源到 Android 项目**

```bash
npx cap sync android
```

**Step 4: Commit（Android 项目是否提交由用户决定）**

---

### Task 5: 配置 WebView 全屏显示

**目标:** 修改 Android 主题，隐藏系统状态栏，实现沉浸式体验

**Files:**
- Modify: `frontend/android/app/src/main/res/values/styles.xml`

**Step 1: 修改主题为全屏**

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.NoActionBar">
        <item name="windowNoTitle">true</item>
        <item name="windowActionBar">false</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>
```

**Step 2: 应用主题到 Activity**

修改 `frontend/android/app/src/main/AndroidManifest.xml`，在 MainActivity 标签中添加:

```xml
android:theme="@style/AppTheme.NoActionBar"
```

**Step 3: Commit**

```bash
git add android/app/src/main/res/values/styles.xml android/app/src/main/AndroidManifest.xml
git commit -m "feat: configure Android fullscreen theme"
```

---

### Task 6: 配置返回键处理

**目标:** 拦截返回键，优先执行网页内返回，首页再退出 App

**Files:**
- Modify: `frontend/android/app/src/main/java/com/xueqiu/xforyou/MainActivity.java`

**Step 1: 修改 MainActivity**

```java
package com.xueqiu.xforyou;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

**Step 2: 验证代码**

检查文件语法无误，包名与 capacitor.config.json 中的 appId 一致

**Step 3: Commit**

```bash
git add android/app/src/main/java/com/xueqiu/xforyou/MainActivity.java
git commit -m "feat: handle back button for in-app navigation"
```

---

### Task 7: 配置外部链接跳转系统浏览器

**目标:** 点击 x.com 等外部链接时，跳转系统浏览器而不是在 WebView 内打开

**Files:**
- Modify: `frontend/src/main.js` 或创建原生拦截（选择原生方式更可靠）
- Modify: `frontend/android/app/src/main/java/com/xueqiu/xforyou/MainActivity.java`

**Step 1: 修改 MainActivity 添加 URL 拦截**

```java
package com.xueqiu.xforyou;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 延迟设置 WebViewClient 以拦截外部链接
        getBridge().getWebView().setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String url = uri.toString();

                // 外部链接跳转到系统浏览器
                if (url.startsWith("https://x.com/") || url.startsWith("https://twitter.com/")) {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                    return true;
                }

                return super.shouldOverrideUrlLoading(view, request);
            }
        });
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

**Step 2: Commit**

```bash
git add android/app/src/main/java/com/xueqiu/xforyou/MainActivity.java
git commit -m "feat: open external links in system browser"
```

---

### Task 8: 验证 Android 项目配置

**目标:** 确保所有配置正确，项目能正常打开

**Step 1: 同步项目**

```bash
cd D:/xueqiu_crx/frontend
npx cap sync android
```

**Step 2: 在 Android Studio 中打开**

```bash
npx cap open android
```

Expected: Android Studio 启动并加载项目

**Step 3: 检查 Gradle 同步**

在 Android Studio 中等待 Gradle sync 完成，无红色错误提示

---

### Task 9: 构建 Debug APK

**目标:** 生成可安装的 Debug 版本 APK

**Step 1: 构建 APK**

在 Android Studio 中:
- 点击菜单 Build → Build Bundle(s) / APK(s) → Build APK(s)

或通过命令行:
```bash
cd android
./gradlew assembleDebug
```

**Step 2: 验证 APK 生成**

Run: `ls -lh android/app/build/outputs/apk/debug/`
Expected: 存在 app-debug.apk 文件（约 15-25MB）

**Step 3: 记录 APK 路径**

APK 位置: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

### Task 10: 安装到设备测试

**目标:** 在真机或模拟器上安装并测试

**Step 1: 连接设备或启动模拟器**

**Step 2: 安装 APK**

```bash
cd D:/xueqiu_crx/frontend/android
adb install app/build/outputs/apk/debug/app-debug.apk
```

或通过 Android Studio 直接点击 Run 按钮

**Step 3: 验证功能**
- App 正常启动
- 显示前端页面
- 返回键正常工作
- 外部链接跳转系统浏览器

---

### Task 11: 构建 Release APK（可选）

**目标:** 生成 Release 版本 APK（用于分享安装）

**Step 1: 在 Android Studio 中构建**

Build → Generate Signed Bundle / APK → APK

**Step 2: 创建签名密钥（首次需要）**

按照向导创建 .jks 签名文件

**Step 3: 验证 APK 生成**

APK 位置: `android/app/build/outputs/apk/release/app-release.apk`

---

### Task 12: 更新 .gitignore

**目标:** 避免提交生成的 Android 项目文件

**Files:**
- Modify: `frontend/.gitignore`

**Step 1: 添加忽略规则**

```
# Capacitor Android 项目（可通过 cap sync 重新生成）
/android/

# 构建输出
/dist/
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore Capacitor generated files"
```

---

## 后续维护

### 更新 Web 内容后重新打包

```bash
cd D:/xueqiu_crx/frontend
npm run build
npx cap sync android
# 然后在 Android Studio 中重新构建 APK
```

### 重新生成 Android 项目（如果误删）

```bash
npx cap add android
# 然后重新应用 Task 5-7 的配置修改
```

---

## 常见问题

1. **Gradle 同步失败**: 检查 Android Studio SDK 配置，确保 API 33+ 已安装
2. **APK 安装失败**: 确保设备允许安装未知来源应用
3. **WebView 白屏**: 检查前端构建是否正确，`dist/` 目录包含有效文件
