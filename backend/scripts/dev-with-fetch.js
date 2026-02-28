/**
 * 开发模式启动脚本：自动抓取 Query ID 并启动后端
 *
 * 使用方法:
 * node scripts/dev-with-fetch.js
 *
 * 流程:
 * 1. 检查 Chrome 是否已启动调试模式
 * 2. 如果已启动，尝试抓取 Query ID
 * 3. 更新 .env 文件
 * 4. 启动后端服务
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const CHROME_DEBUG_PORT = 9222;
const ENV_PATH = path.join(process.cwd(), '..', '.env');

async function main() {
  console.log('🚀 开发模式启动器');
  console.log('==================\n');

  // 检查是否需要抓取 Query ID
  const envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
  const hasForYouId = envContent.includes('HOME_TIMELINE_QUERY_ID=') &&
                      !envContent.match(/HOME_TIMELINE_QUERY_ID=/);
  const hasFollowingId = envContent.includes('HOME_LATEST_TIMELINE_QUERY_ID=') &&
                         !envContent.match(/HOME_LATEST_TIMELINE_QUERY_ID=/);

  if (!hasFollowingId) {
    console.log('⚠️  Following Query ID 需要更新');
    console.log('   尝试自动抓取...\n');

    const success = await tryFetchQueryIds();

    if (!success) {
      console.log('\n❌ 自动抓取失败');
      console.log('\n💡 请手动操作:');
      console.log('   1. 关闭所有 Chrome 窗口');
      console.log('   2. 运行: scripts/start-chrome-debug.bat');
      console.log('   3. 在 Chrome 中打开 https://x.com/home 并确保已登录');
      console.log('   4. 重新运行本脚本\n');

      // 询问是否继续启动
      const answer = await askQuestion('是否继续启动后端 (使用默认 Query ID)? [y/N] ');
      if (answer.toLowerCase() !== 'y') {
        process.exit(0);
      }
    }
  } else {
    console.log('✅ Query ID 已配置');
  }

  // 启动后端
  console.log('\n🚀 启动后端服务...\n');
  startBackend();
}

async function tryFetchQueryIds() {
  try {
    // 检查是否可以连接到 Chrome
    const browser = await puppeteer.connect({
      browserURL: `http://localhost:${CHROME_DEBUG_PORT}`,
      defaultViewport: null,
    }).catch(() => null);

    if (!browser) {
      console.log('❌ 无法连接到 Chrome 调试端口 (9222)');
      return false;
    }

    console.log('✅ 已连接到 Chrome');

    const pages = await browser.pages();
    let xPage = pages.find(p => p.url().includes('x.com'));

    if (!xPage) {
      console.log('🌐 打开 x.com...');
      xPage = await browser.newPage();
      await xPage.goto('https://x.com/home', { waitUntil: 'networkidle2', timeout: 10000 });
    }

    const queryIds = { forYou: null, following: null };

    // 监听请求
    await xPage.setRequestInterception(true);
    xPage.on('request', (request) => {
      const url = request.url();
      if (url.includes('/HomeTimeline')) {
        const match = url.match(/graphql\/([a-zA-Z0-9_-]+)\/HomeTimeline/);
        if (match && !queryIds.forYou) queryIds.forYou = match[1];
      }
      if (url.includes('/HomeLatestTimeline')) {
        const match = url.match(/graphql\/([a-zA-Z0-9_-]+)\/HomeLatestTimeline/);
        if (match && !queryIds.following) queryIds.following = match[1];
      }
      request.continue();
    });

    // 刷新获取 For You
    console.log('🔄 抓取 For You Query ID...');
    await xPage.reload({ waitUntil: 'networkidle2' });
    await wait(2000);

    // 点击 Following
    console.log('🔄 抓取 Following Query ID...');
    try {
      const followingLink = await xPage.$('a[href="/home"]');
      if (followingLink) await followingLink.click();
      await wait(3000);
    } catch (e) {
      console.log('   请手动点击 Following 标签');
    }

    await wait(3000);
    await browser.disconnect();

    console.log('\n📊 抓取结果:');
    console.log('   For You:   ', queryIds.forYou || '❌ 未抓取');
    console.log('   Following: ', queryIds.following || '❌ 未抓取');

    if (queryIds.following || queryIds.forYou) {
      updateEnvFile(queryIds);
      console.log('✅ 已更新 .env 文件');
      return true;
    }

    return false;
  } catch (err) {
    console.log('❌ 抓取出错:', err.message);
    return false;
  }
}

function updateEnvFile(queryIds) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';

  if (queryIds.forYou) {
    if (content.includes('HOME_TIMELINE_QUERY_ID=')) {
      content = content.replace(/HOME_TIMELINE_QUERY_ID=.*/, `HOME_TIMELINE_QUERY_ID=${queryIds.forYou}`);
    } else {
      content += `\nHOME_TIMELINE_QUERY_ID=${queryIds.forYou}`;
    }
  }

  if (queryIds.following) {
    if (content.includes('HOME_LATEST_TIMELINE_QUERY_ID=')) {
      content = content.replace(/HOME_LATEST_TIMELINE_QUERY_ID=.*/, `HOME_LATEST_TIMELINE_QUERY_ID=${queryIds.following}`);
    } else {
      content += `\nHOME_LATEST_TIMELINE_QUERY_ID=${queryIds.following}`;
    }
  }

  fs.writeFileSync(ENV_PATH, content);
}

function startBackend() {
  const logPath = path.join(process.cwd(), '..', 'backend.log');

  // 清空日志
  fs.writeFileSync(logPath, '');

  const child = spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });

  // 输出到控制台和日志文件
  child.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    fs.appendFileSync(logPath, text);
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(text);
    fs.appendFileSync(logPath, text);
  });

  child.on('error', (err) => {
    console.error('启动后端失败:', err.message);
    process.exit(1);
  });

  console.log(`📁 日志写入: ${logPath}`);
  console.log('   查看日志: tail -f backend.log');
  console.log('\n按 Ctrl+C 停止后端\n');

  // 保持进程运行
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', () => {
    console.log('\n👋 停止后端...');
    child.kill();
    process.exit(0);
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function askQuestion(question) {
  return new Promise(resolve => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

main().catch(console.error);
