import axios from 'axios';

let browser = null;
let playwright = null;
let useAxios = true; // 默认使用 axios

/**
 * 获取或创建浏览器实例
 */
async function getBrowser() {
  if (useAxios) return null;

  if (!browser) {
    try {
      if (!playwright) {
        playwright = await import('playwright');
      }
      const chromium = playwright.chromium;
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled'
        ]
      });
    } catch (err) {
      console.log('Playwright 不可用，使用 axios 方案:', err.message);
      useAxios = true;
      return null;
    }
  }
  return browser;
}

/**
 * 获取雪球 Cookie
 */
async function getCookie() {
  const { getSetting } = await import('../db/index.js');
  const dbCookie = await getSetting('XUEQIU_COOKIE', '');
  if (dbCookie) {
    return dbCookie;
  }
  const envCookie = process.env.XUEQIU_COOKIE;
  if (!envCookie) {
    throw new Error('XUEQIU_COOKIE 未设置，请先在设置中配置');
  }
  return envCookie;
}

/**
 * 使用 Playwright 或 axios 获取雪球用户时间线
 */
async function getUserTimeline(userId, page = 1, type = 1) {
  // 备用方案：使用 axios 直接请求
  if (useAxios) {
    try {
      const cookie = await getCookie();
      const response = await axios.get(
        `https://xueqiu.com/statuses/user_timeline.json?user_id=${userId}&page=${page}`,
        {
          headers: {
            'Cookie': `xq_a_token=${cookie}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://xueqiu.com/'
          },
          timeout: 30000
        }
      );
      return response.data;
    } catch (e) {
      console.log('axios 请求失败:', e.message);
      return { statuses: [], maxPage: 1 };
    }
  }

  const b = await getBrowser();
  if (!b) return { statuses: [], maxPage: 1 };

  const context = await b.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page2 = await context.newPage();

  // 设置 Cookie
  const cookie = await getCookie();
  await context.addCookies([{
    name: 'xq_a_token',
    value: cookie,
    domain: 'xueqiu.com',
    path: '/'
  }]);

  // 直接访问 API 获取数据
  const apiUrl = `https://xueqiu.com/statuses/user_timeline.json?user_id=${userId}&page=${page}&type=${type}`;

  try {
    const response = await page2.goto(apiUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    const json = await response.json();
    await page2.close();
    await context.close();
    return json;
  } catch (e) {
    console.log('API请求失败:', e.message);
    // 降级到备用方案
    useAxios = true;
    await page2.close();
    await context.close();
    return getUserTimeline(userId, page, type);
  }
}

/**
 * 通过 axios 获取用户信息（axios 模式）
 */
async function getUserInfoByAxios(userId) {
  try {
    const cookie = await getCookie();
    const response = await axios.get(
      `https://xueqiu.com/v4/users/${userId}`,
      {
        headers: {
          'Cookie': `xq_a_token=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://xueqiu.com/'
        },
        timeout: 30000
      }
    );
    const user = response.data?.user || response.data;
    let screenName = user?.screen_name || user?.name || String(userId);
    screenName = screenName.replace(/\s*[-–]\s*雪球$/, '').trim();
    return {
      id: user?.id || userId,
      screen_name: screenName,
      profile_image_url: user?.profile_image_url,
      description: user?.description,
      followers_count: user?.followers_count,
      friends_count: user?.friends_count,
      statuses_count: user?.statuses_count
    };
  } catch (e) {
    console.log('axios 获取用户信息失败:', e.message);
    return { id: userId, screen_name: String(userId) };
  }
}

/**
 * 通过用户名/ID 获取用户信息
 */
async function getUserInfoByScreenName(screenName) {
  // axios 模式：直接用 API 获取
  if (useAxios) {
    return getUserInfoByAxios(screenName);
  }

  const b = await getBrowser();
  if (!b) {
    return getUserInfoByAxios(screenName);
  }

  const context = await b.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page2 = await context.newPage();

  const cookie = await getCookie();
  await context.addCookies([{
    name: 'xq_a_token',
    value: cookie,
    domain: 'xueqiu.com',
    path: '/'
  }]);

  const url = `https://xueqiu.com/u/${screenName}`;

  try {
    await page2.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    const userInfo = await page2.evaluate(() => {
      if (window.SNOW && window.SNOW.user) {
        return window.SNOW.user;
      }
      let name = document.title.replace(' 的主页 - 雪球', '') || '未知用户';
      // 去掉 -雪球 后缀
      name = name.replace(/\s*[-–]\s*雪球$/, '').trim();
      return { screen_name: name };
    });

    await page2.close();
    await context.close();
    return userInfo;
  } catch (error) {
    console.error('Playwright 请求用户信息失败:', error.message);
    await page2.close();
    await context.close();
    throw error;
  }
}

/**
 * 统一数据格式
 */
function parseTimelineItem(item) {
  let screenName = item.user?.screen_name || item.user?.name || '';
  // 去掉 -雪球 后缀
  screenName = screenName.replace(/\s*[-–]\s*雪球$/, '').trim();

  return {
    id: item.id,
    text: item.text || item.description || '',
    created_at: item.created_at,
    user: {
      id: item.user?.id,
      screen_name: screenName,
      profile_image_url: item.user?.profile_image_url?.replace('_square', '_small'),
      description: item.user?.description,
      followers_count: item.user?.followers_count,
      friends_count: item.user?.friends_count,
      statuses_count: item.user?.statuses_count
    },
    reposts_count: item.reposts_count || 0,
    comments_count: item.comments_count || 0,
    likes_count: item.likes_count || 0,
    photos: item.photos || [],
    retweet: item.retweet,
    source: item.source,
    symbols: item.symbols || []
  };
}

function parseTimelineResponse(response) {
  const statuses = response.statuses || [];
  return {
    statuses: statuses.map(parseTimelineItem),
    maxPage: response.maxPage || 1,
    count: response.count || statuses.length
  };
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export default {
  getUserTimeline,
  getUserInfoByScreenName,
  parseTimelineResponse,
  parseTimelineItem,
  closeBrowser,
  getBrowser
};
