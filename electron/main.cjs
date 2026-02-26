const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webviewTag: true  // 启用 webview 标签
    }
  });

  // 开发环境加载 Vue dev server，生产环境加载打包后的文件
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境加载打包后的前端文件
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
}

// 启动后端服务
function startBackend() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // 开发模式：后端由 npm run dev:backend 单独启动，这里不重复启动
    console.log('Development mode: backend should be started by npm run dev:backend');
    return;
  }

  // 生产模式：启动打包后的后端
  backendProcess = spawn('node', ['src/index.js'], {
    cwd: path.join(__dirname, '../backend'),
    stdio: 'inherit',
    shell: true
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

// 拦截并修改响应头（关键：移除 X-Frame-Options）
app.whenReady().then(() => {
  // 配置会话以移除 X-Frame-Options 和 CSP
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;

    // 移除 X-Frame-Options（大小写不敏感）
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

  // 启动后端服务（生产模式）
  startBackend();

  // 开发模式下后端已由 npm run dev:backend 启动，无需等待
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    createWindow();
  } else {
    // 生产模式：等待后端启动完成
    setTimeout(() => {
      createWindow();
    }, 2000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
