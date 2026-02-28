@echo off
echo ==========================================
echo  启动 Chrome 调试模式
echo ==========================================
echo.
echo 正在启动 Chrome (端口 9222)...
echo.
echo 启动后请：
echo 1. 确保已登录 x.com
echo 2. 在新标签页打开 https://x.com/home
echo 3. 运行: node scripts/fetch-query-id.js
echo.

set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"

if not exist %CHROME_PATH% (
    set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

if not exist %CHROME_PATH% (
    echo 未找到 Chrome，请手动指定路径
    pause
    exit /b 1
)

%CHROME_PATH% --remote-debugging-port=9222 --user-data-dir=%TEMP%\chrome-debug-profile

pause
