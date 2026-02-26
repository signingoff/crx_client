const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露 API 给前端
contextBridge.exposeInMainWorld('electronAPI', {
  // 检测是否在 Electron 环境中运行
  isElectron: true,

  // 可以在这里添加主进程与渲染进程通信的方法
  // 例如：
  // sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  // onMessage: (channel, callback) => ipcRenderer.on(channel, callback)
});

// 暴露 webview preload 脚本路径
contextBridge.exposeInMainWorld('electronPaths', {
  webviewPreload: `file://${__dirname}/webview-preload.cjs`
});
