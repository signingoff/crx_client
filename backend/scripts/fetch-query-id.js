/**
 * 自动抓取 X.com Query ID
 * 使用已登录的 Chrome，无需手动登录
 *
 * 使用方法:
 * 1. 关闭所有 Chrome 窗口
 * 2. 打开命令行，执行: chrome.exe --remote-debugging-port=9222
 * 3. 在新标签页打开 https://x.com/home
 * 4. 运行: node scripts/fetch-query-id.js
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_DEBUG_PORT = 9222;
const TIMEOUT = 30000;

async function fetchQueryIds() {
  console.log('🔗 连接到 Chrome...');
  console.log('   请确保 Chrome 已启动: chrome.exe --remote-debugging-port=9222');
  console.log('   并且已登录 x.com');
  console.log();

  try {
    const browser = await puppeteer.connect({
      browserURL: `http://localhost:${CHROME_DEBUG_PORT}`,
      defaultViewport: null,
    });

    console.log('✅ 已连接到 Chrome');
    console.log();

    // 获取所有页面
    const pages = await browser.pages();
    let xPage = pages.find(p => p.url().includes('x.com'));

    if (!xPage) {
      console.log('🌐 打开 x.com...');
      xPage = await browser.newPage();
      await xPage.goto('https://x.com/home', { waitUntil: 'networkidle2' });
    } else {
      console.log('🌐 使用已打开的 x.com 页面');
    }

    const queryIds = {
      forYou: null,
      following: null
    };

    // 设置请求拦截
    console.log('📡 监听网络请求...');
    console.log();

    await xPage.setRequestInterception(true);

    xPage.on('request', (request) => {
      const url = request.url();

      // 抓取 For You (HomeTimeline)
      if (url.includes('/HomeTimeline')) {
        const match = url.match(/graphql\/([a-zA-Z0-9_-]+)\/HomeTimeline/);
        if (match && !queryIds.forYou) {
          queryIds.forYou = match[1];
          console.log('✅ 抓取到 For You Query ID:', queryIds.forYou);
        }
      }

      // 抓取 Following (HomeLatestTimeline)
      if (url.includes('/HomeLatestTimeline')) {
        const match = url.match(/graphql\/([a-zA-Z0-9_-]+)\/HomeLatestTimeline/);
        if (match && !queryIds.following) {
          queryIds.following = match[1];
          console.log('✅ 抓取到 Following Query ID:', queryIds.following);
        }
      }

      request.continue();
    });

    // 刷新页面获取 For You
    console.log('🔄 刷新页面获取 For You Query ID...');
    await xPage.reload({ waitUntil: 'networkidle2' });
    await wait(3000);

    // 点击 Following 标签
    console.log('🔄 点击 Following 标签...');
    try {
      // 尝试多种选择器
      const followingTab = await xPage.$('a[href="/home"]') ||
                          await xPage.$('[data-testid="AppTabBar_Following_Link"]') ||
                          await xPage.$('span:contains("Following")');

      if (followingTab) {
        await followingTab.click();
        await wait(3000);
      } else {
        console.log('⚠️ 未找到 Following 标签，请手动点击');
      }
    } catch (err) {
      console.log('⚠️ 自动点击失败，请手动点击 Following 标签');
    }

    // 等待更多请求
    await wait(5000);

    console.log();
    console.log('📊 抓取结果:');
    console.log('─────────────────────────────');
    console.log('For You:     ', queryIds.forYou || '❌ 未抓取到');
    console.log('Following:   ', queryIds.following || '❌ 未抓取到');
    console.log('─────────────────────────────');
    console.log();

    // 更新 .env 文件
    if (queryIds.forYou || queryIds.following) {
      await updateEnvFile(queryIds);
      console.log('✅ 已更新 .env 文件');
    } else {
      console.log('❌ 未抓取到任何 Query ID，请重试');
      console.log('   提示: 确保页面已加载推文，且网络请求正常');
    }

    await browser.disconnect();

  } catch (err) {
    console.error('❌ 错误:', err.message);
    console.log();
    console.log('💡 请检查:');
    console.log('   1. Chrome 是否以调试模式启动');
    console.log('   2. 端口 9222 是否正确');
    console.log('   3. 是否已安装 puppeteer-core');
    console.log();
    console.log('启动 Chrome 命令:');
    console.log('   Windows: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222');
    console.log('   Mac: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateEnvFile(queryIds) {
  const envPath = path.join(process.cwd(), '..', '.env');

  if (!fs.existsSync(envPath)) {
    console.log('⚠️ .env 文件不存在，跳过更新');
    return;
  }

  let content = fs.readFileSync(envPath, 'utf-8');

  // 更新 For You Query ID
  if (queryIds.forYou) {
    if (content.includes('HOME_TIMELINE_QUERY_ID=')) {
      content = content.replace(
        /HOME_TIMELINE_QUERY_ID=.*/,
        `HOME_TIMELINE_QUERY_ID=${queryIds.forYou}`
      );
    } else {
      content += `\nHOME_TIMELINE_QUERY_ID=${queryIds.forYou}`;
    }
  }

  // 更新 Following Query ID
  if (queryIds.following) {
    if (content.includes('HOME_LATEST_TIMELINE_QUERY_ID=')) {
      content = content.replace(
        /HOME_LATEST_TIMELINE_QUERY_ID=.*/,
        `HOME_LATEST_TIMELINE_QUERY_ID=${queryIds.following}`
      );
    } else {
      content += `\nHOME_LATEST_TIMELINE_QUERY_ID=${queryIds.following}`;
    }
  }

  fs.writeFileSync(envPath, content);
  console.log('📝 文件路径:', envPath);
}

fetchQueryIds();
