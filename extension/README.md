# X For You - Chrome Extension

允许 X For You 应用在 iframe 中嵌入 X.com，并优化显示效果。

## 功能

1. **移除 X-Frame-Options 限制** - 允许 X.com 在 iframe 中加载
2. **自动隐藏 UI 元素** - 在 iframe 中隐藏 header、sidebar、底部导航等
3. **扩展检测** - 父页面可以检测扩展是否已安装

## 安装方法

### 方法 1: 加载已解压的扩展（开发）

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本 `extension` 文件夹
5. 扩展已安装，刷新 X For You 页面即可使用

### 方法 2: Chrome Web Store（发布后）

待发布...

## 文件说明

- `manifest.json` - 扩展配置文件
- `rules.json` -  declarativeNetRequest 规则，移除 X-Frame-Options
- `content-script.js` - 在 X.com 页面注入的脚本，隐藏 UI 元素

## 通信协议

父页面可以通过 `postMessage` 与扩展通信：

```javascript
// 检测扩展是否安装
window.postMessage({ type: 'PING_FROM_PAGE' }, '*');

// 监听响应
window.addEventListener('message', (e) => {
  if (e.data.type === 'PONG_FROM_EXTENSION') {
    console.log('扩展已安装，版本:', e.data.data.version);
  }
});
```

## 注意事项

- 扩展需要权限访问 x.com 和 twitter.com
- 仅修改响应头和样式，不收集任何用户数据
