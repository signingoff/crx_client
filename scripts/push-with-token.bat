@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM 从 .github-token 文件读取 token
cd /d "%~dp0\.."
set TOKEN=
for /f "tokens=2 delims==" %%a in ('findstr "^TOKEN=" .github-token') do set TOKEN=%%a

if "!TOKEN!"=="" (
    echo 错误: 未找到 TOKEN，请检查 .github-token 文件
    exit /b 1
)

REM 临时设置带 token 的 remote URL
git remote set-url origin "https://signingoff:!TOKEN!@github.com/signingoff/crx_client.git"

REM 执行 push
git push origin main

REM 清除 token，恢复普通 URL
git remote set-url origin "https://github.com/signingoff/crx_client.git"

echo.
echo Push 完成，token 已清除
