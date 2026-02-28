#!/bin/bash

# 从 .github-token 文件读取 token
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# 读取 token
TOKEN=$(grep "^TOKEN=" .github-token | cut -d '=' -f2)

if [ -z "$TOKEN" ]; then
    echo "错误: 未找到 TOKEN，请检查 .github-token 文件"
    exit 1
fi

# 临时设置带 token 的 remote URL
git remote set-url origin "https://signingoff:${TOKEN}@github.com/signingoff/crx_client.git"

# 执行 push
git push origin main

# 清除 token，恢复普通 URL
git remote set-url origin "https://github.com/signingoff/crx_client.git"

echo ""
echo "Push 完成，token 已清除"
