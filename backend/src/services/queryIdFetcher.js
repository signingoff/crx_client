import axios from 'axios';
import { xCookies } from '../config/auth.js';

/**
 * 从 X.com 自动提取 GraphQL Query ID
 * 通过分析 API 响应和 HTML 内容来获取 Query ID
 */

const X_HOME_URL = 'https://x.com/home';
const X_API_BASE = 'https://x.com/i/api/graphql';

/**
 * 测试 Query ID 是否有效
 */
async function testQueryId(queryId, operation) {
  const url = `${X_API_BASE}/${queryId}/${operation}`;

  const headers = {
    'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'x-csrf-token': xCookies.ct0,
    'cookie': `auth_token=${xCookies.auth_token}; ct0=${xCookies.ct0}`,
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'referer': 'https://x.com/home'
  };

  const variables = {
    count: 1,
    includePromotedContent: false,
    latestControlAvailable: true
  };

  try {
    const response = await axios.get(url, {
      headers,
      params: { variables: JSON.stringify(variables) },
      timeout: 10000
    });

    // 如果返回了预期的数据结构，说明 Query ID 有效
    if (response.data && response.data.data) {
      return true;
    }
    return false;
  } catch (error) {
    // 404 表示 Query ID 无效
    if (error.response?.status === 404) {
      return false;
    }
    // 其他错误可能是权限问题
    return null;
  }
}

/**
 * 从 HTML 中提取 Query ID
 */
function extractQueryIdsFromHtml(html) {
  const results = {
    homeTimeline: [],
    homeLatestTimeline: [],
    userTweets: [],
    userByScreenName: []
  };

  // X.com 的 Query ID 通常是 22 位的 base64-like 字符串
  const queryIdPattern = /[A-Za-z0-9_-]{22}/g;
  const allMatches = html.match(queryIdPattern) || [];

  // 查找 HomeTimeline 相关的 Query ID
  // 模式1: "HomeTimeline":"xxxxx"
  const homeTimelineRegex1 = /HomeTimeline["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{22})/gi;
  let match;
  while ((match = homeTimelineRegex1.exec(html)) !== null) {
    results.homeTimeline.push(match[1]);
  }

  // 模式2: HomeLatestTimeline
  const homeLatestRegex1 = /HomeLatestTimeline["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{22})/gi;
  while ((match = homeLatestRegex1.exec(html)) !== null) {
    results.homeLatestTimeline.push(match[1]);
  }

  // 模式3: UserTweets
  const userTweetsRegex1 = /UserTweets["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{22})/gi;
  while ((match = userTweetsRegex1.exec(html)) !== null) {
    results.userTweets.push(match[1]);
  }

  // 模式4: UserByScreenName
  const userByScreenNameRegex1 = /UserByScreenName["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{22})/gi;
  while ((match = userByScreenNameRegex1.exec(html)) !== null) {
    results.userByScreenName.push(match[1]);
  }

  // 模式5: operationName 模式
  const opRegex = /operationName["']?\s*:\s*["']?(Home(?:Latest)?Timeline|UserTweets|UserByScreenName)["']?[^}]*queryId["']?\s*:\s*["']?([A-Za-z0-9_-]{22})/gi;
  while ((match = opRegex.exec(html)) !== null) {
    const opName = match[1];
    const queryId = match[2];
    if (opName === 'HomeTimeline') {
      results.homeTimeline.push(queryId);
    } else if (opName === 'HomeLatestTimeline') {
      results.homeLatestTimeline.push(queryId);
    } else if (opName === 'UserTweets') {
      results.userTweets.push(queryId);
    } else if (opName === 'UserByScreenName') {
      results.userByScreenName.push(queryId);
    }
  }

  // 去重
  results.homeTimeline = [...new Set(results.homeTimeline)];
  results.homeLatestTimeline = [...new Set(results.homeLatestTimeline)];
  results.userTweets = [...new Set(results.userTweets)];
  results.userByScreenName = [...new Set(results.userByScreenName)];

  return results;
}

/**
 * 获取 JS 文件内容
 */
async function fetchJsFile(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.data;
  } catch (err) {
    console.warn(`Failed to fetch JS: ${url}`, err.message);
    return '';
  }
}

/**
 * 从 HTML 中提取 JS 文件 URL
 */
function extractJsUrls(html) {
  const jsUrls = [];
  // 匹配 script src 属性
  const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const url = match[1];
    // 只关注主 bundle 文件（通常包含 GraphQL 配置）
    if (url.includes('main.') || url.includes('bundle.') || url.includes('app.')) {
      jsUrls.push(url.startsWith('http') ? url : `https://x.com${url}`);
    }
  }
  return jsUrls;
}

/**
 * 从 JS 内容中提取 Query ID
 * X.com 的 Query ID 通常以特定格式存储在 JS 中
 */
function extractQueryIdsFromJs(jsContent) {
  const results = {
    homeTimeline: [],
    homeLatestTimeline: [],
    userTweets: [],
    userByScreenName: []
  };

  // 模式1: 查找 HomeTimeline 相关的 Query ID
  // 格式通常是: {queryId:"xxxxx",operationName:"HomeTimeline"}
  const homeTimelineRegex = /queryId[^}]*["']([A-Za-z0-9_-]{22})["'][^}]*operationName[^}]*["']HomeTimeline["']/gi;
  let match;
  while ((match = homeTimelineRegex.exec(jsContent)) !== null) {
    results.homeTimeline.push(match[1]);
  }

  // 反向顺序也尝试
  const homeTimelineRegex2 = /operationName[^}]*["']HomeTimeline["'][^}]*queryId[^}]*["']([A-Za-z0-9_-]{22})["']/gi;
  while ((match = homeTimelineRegex2.exec(jsContent)) !== null) {
    results.homeTimeline.push(match[1]);
  }

  // 模式2: 查找 HomeLatestTimeline 相关的 Query ID
  const homeLatestRegex = /queryId[^}]*["']([A-Za-z0-9_-]{22})["'][^}]*operationName[^}]*["']HomeLatestTimeline["']/gi;
  while ((match = homeLatestRegex.exec(jsContent)) !== null) {
    results.homeLatestTimeline.push(match[1]);
  }

  const homeLatestRegex2 = /operationName[^}]*["']HomeLatestTimeline["'][^}]*queryId[^}]*["']([A-Za-z0-9_-]{22})["']/gi;
  while ((match = homeLatestRegex2.exec(jsContent)) !== null) {
    results.homeLatestTimeline.push(match[1]);
  }

  // 模式3: 查找 UserTweets 相关的 Query ID
  const userTweetsRegex = /queryId[^}]*["']([A-Za-z0-9_-]{22})["'][^}]*operationName[^}]*["']UserTweets["']/gi;
  while ((match = userTweetsRegex.exec(jsContent)) !== null) {
    results.userTweets.push(match[1]);
  }

  const userTweetsRegex2 = /operationName[^}]*["']UserTweets["'][^}]*queryId[^}]*["']([A-Za-z0-9_-]{22})["']/gi;
  while ((match = userTweetsRegex2.exec(jsContent)) !== null) {
    results.userTweets.push(match[1]);
  }

  // 模式4: 查找 UserByScreenName 相关的 Query ID
  const userByScreenNameRegex = /queryId[^}]*["']([A-Za-z0-9_-]{22})["'][^}]*operationName[^}]*["']UserByScreenName["']/gi;
  while ((match = userByScreenNameRegex.exec(jsContent)) !== null) {
    results.userByScreenName.push(match[1]);
  }

  const userByScreenNameRegex2 = /operationName[^}]*["']UserByScreenName["'][^}]*queryId[^}]*["']([A-Za-z0-9_-]{22})["']/gi;
  while ((match = userByScreenNameRegex2.exec(jsContent)) !== null) {
    results.userByScreenName.push(match[1]);
  }

  // 去重
  results.homeTimeline = [...new Set(results.homeTimeline)];
  results.homeLatestTimeline = [...new Set(results.homeLatestTimeline)];
  results.userTweets = [...new Set(results.userTweets)];
  results.userByScreenName = [...new Set(results.userByScreenName)];

  return results;
}

/**
 * 从页面加载的 JS 文件中提取 Query ID
 */
async function extractFromJsFiles(html) {
  const jsUrls = extractJsUrls(html);

  const allResults = {
    homeTimeline: [],
    homeLatestTimeline: [],
    userTweets: [],
    userByScreenName: []
  };

  for (const url of jsUrls.slice(0, 3)) {
    try {
      const jsContent = await fetchJsFile(url);
      if (jsContent) {
        const results = extractQueryIdsFromJs(jsContent);
        allResults.homeTimeline.push(...results.homeTimeline);
        allResults.homeLatestTimeline.push(...results.homeLatestTimeline);
        allResults.userTweets.push(...results.userTweets);
        allResults.userByScreenName.push(...results.userByScreenName);
      }
    } catch (err) {
      // 忽略 JS 加载错误
    }
  }

  // 去重
  allResults.homeTimeline = [...new Set(allResults.homeTimeline)];
  allResults.homeLatestTimeline = [...new Set(allResults.homeLatestTimeline)];
  allResults.userTweets = [...new Set(allResults.userTweets)];
  allResults.userByScreenName = [...new Set(allResults.userByScreenName)];

  return allResults;
}

/**
 * 从 x.com 主页获取 Query ID
 */
async function extractFromHomePage() {
  const headers = {
    'cookie': `auth_token=${xCookies.auth_token}; ct0=${xCookies.ct0}`,
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'referer': 'https://x.com/'
  };

  try {
    const response = await axios.get(X_HOME_URL, {
      headers,
      timeout: 30000
    });
    return extractQueryIdsFromHtml(response.data);
  } catch (error) {
    console.error('Failed to fetch homepage:', error.message);
    return { homeTimeline: [], homeLatestTimeline: [] };
  }
}

/**
 * 从 x.com Following 页面获取 Query ID
 * HomeLatestTimeline 的 Query ID 通常在 Following 页面加载
 */
async function extractFromFollowingPage() {
  const headers = {
    'cookie': `auth_token=${xCookies.auth_token}; ct0=${xCookies.ct0}`,
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'referer': 'https://x.com/home'
  };

  try {
    // 尝试访问 Following 页面
    // X.com 使用 URL 参数 filter=following 来显示 Following 时间线
    const urls = [
      'https://x.com/home?filter=following',
      'https://x.com/home?following=true'
    ];

    for (const url of urls) {
      try {
        console.log(`  Trying to fetch Following page: ${url}`);
        const response = await axios.get(url, {
          headers,
          timeout: 15000,
          validateStatus: (status) => status < 400 || status === 404
        });

        if (response.status === 200) {
          const results = extractQueryIdsFromHtml(response.data);
          if (results.homeLatestTimeline.length > 0) {
            console.log(`  ✅ Found HomeLatestTimeline candidates from ${url}`);
            return results;
          }
        }
      } catch (err) {
        console.log(`  ⚠️ Failed to fetch ${url}: ${err.message}`);
      }
    }

    return { homeTimeline: [], homeLatestTimeline: [] };
  } catch (error) {
    console.error('Failed to fetch following page:', error.message);
    return { homeTimeline: [], homeLatestTimeline: [] };
  }
}

/**
 * 备选方案：使用已知有效的 Query ID 列表进行测试
 */
async function findWorkingQueryId(operation, knownIds) {
  for (const queryId of knownIds) {
    const isValid = await testQueryId(queryId, operation);
    if (isValid === true) {
      console.log(`  ✅ Found working Query ID for ${operation}: ${queryId}`);
      return queryId;
    }
  }
  return null;
}

/**
 * 合并两个候选结果，去重
 */
function mergeCandidates(c1, c2) {
  return {
    homeTimeline: [...new Set([...c1.homeTimeline, ...c2.homeTimeline])],
    homeLatestTimeline: [...new Set([...c1.homeLatestTimeline, ...c2.homeLatestTimeline])],
    userTweets: [...new Set([...(c1.userTweets || []), ...(c2.userTweets || [])])],
    userByScreenName: [...new Set([...(c1.userByScreenName || []), ...(c2.userByScreenName || [])])]
  };
}

/**
 * 主函数：自动获取 Query ID
 */
export async function fetchQueryIdsFromX() {
  console.log('🔍 Auto-fetching Query IDs from x.com...');

  try {
    // 步骤1: 从主页和 Following 页面提取候选 Query ID
    const homeCandidates = await extractFromHomePage();
    const followingCandidates = await extractFromFollowingPage();

    // 合并候选结果
    let candidates = mergeCandidates(homeCandidates, followingCandidates);

    // 步骤2: 从 JS 文件中提取 Query ID
    const homeHtml = await axios.get(X_HOME_URL, {
      headers: {
        'cookie': `auth_token=${xCookies.auth_token}; ct0=${xCookies.ct0}`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    }).then(r => r.data).catch(() => '');

    if (homeHtml) {
      const jsCandidates = await extractFromJsFiles(homeHtml);
      candidates = mergeCandidates(candidates, jsCandidates);
    }

    const results = {
      homeTimeline: null,
      homeLatestTimeline: null,
      userTweets: null,
      userByScreenName: null
    };

    // 步骤3: 测试提取的候选 ID
    if (candidates.homeTimeline.length > 0) {
      results.homeTimeline = await findWorkingQueryId('HomeTimeline', candidates.homeTimeline);
    }
    if (candidates.homeLatestTimeline.length > 0) {
      results.homeLatestTimeline = await findWorkingQueryId('HomeLatestTimeline', candidates.homeLatestTimeline);
    }
    if (candidates.userTweets.length > 0) {
      results.userTweets = await findWorkingQueryId('UserTweets', candidates.userTweets);
    }
    if (candidates.userByScreenName.length > 0) {
      results.userByScreenName = await findWorkingQueryId('UserByScreenName', candidates.userByScreenName);
    }

    // 返回结果
    if (!results.homeTimeline && !results.homeLatestTimeline && !results.userTweets && !results.userByScreenName) {
      throw new Error('无法找到有效的 Query ID。请检查 Cookie 是否过期，或手动输入 Query ID。');
    }

    return {
      success: true,
      homeTimelineQueryId: results.homeTimeline,
      homeLatestTimelineQueryId: results.homeLatestTimeline,
      userTweetsQueryId: results.userTweets,
      userByScreenNameQueryId: results.userByScreenName,
      source: 'auto-fetch',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Failed to fetch Query IDs:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
