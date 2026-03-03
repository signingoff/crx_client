import { chromium } from 'playwright';

let browser = null;

/**
 * 获取或创建浏览器实例
 */
async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
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
 * 使用 Playwright 获取雪球用户时间线
 */
async function getUserTimeline(userId, page = 1, type = 1) {
  const b = await getBrowser();
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
    return json;

    await page2.close();
    await context.close();
    return json;
  } catch (e) {
    console.log('API请求失败:', e.message);
    await page2.close();
    await context.close();
    return { statuses: [], maxPage: 1 };
  }
}

/**
 * 通过用户名获取用户信息
 */
async function getUserInfoByScreenName(screenName) {
  const b = await getBrowser();
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
