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
    homeLatestTimeline: []
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

  // 模式3: operationName 模式
  const opRegex = /operationName["']?\s*:\s*["']?(Home(?:Latest)?Timeline)["']?[^}]*queryId["']?\s*:\s*["']?([A-Za-z0-9_-]{22})/gi;
  while ((match = opRegex.exec(html)) !== null) {
    const opName = match[1];
    const queryId = match[2];
    if (opName === 'HomeTimeline') {
      results.homeTimeline.push(queryId);
    } else if (opName === 'HomeLatestTimeline') {
      results.homeLatestTimeline.push(queryId);
    }
  }

  // 去重
  results.homeTimeline = [...new Set(results.homeTimeline)];
  results.homeLatestTimeline = [...new Set(results.homeLatestTimeline)];

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
 * 备选方案：使用已知有效的 Query ID 列表进行测试
 */
async function findWorkingQueryId(operation, knownIds) {
  for (const queryId of knownIds) {
    console.log(`Testing ${operation} with Query ID: ${queryId}`);
    const isValid = await testQueryId(queryId, operation);
    if (isValid === true) {
      console.log(`✅ Found working Query ID for ${operation}: ${queryId}`);
      return queryId;
    }
  }
  return null;
}

/**
 * 主函数：自动获取 Query ID
 */
export async function fetchQueryIdsFromX() {
  console.log('🔍 Auto-fetching Query IDs from x.com...');

  try {
    // 步骤1: 从主页提取候选 Query ID
    const candidates = await extractFromHomePage();
    console.log('Candidates from homepage:', candidates);

    const results = {
      homeTimeline: null,
      homeLatestTimeline: null
    };

    // 步骤2: 测试主页提取的候选 ID
    if (candidates.homeTimeline.length > 0) {
      results.homeTimeline = await findWorkingQueryId('HomeTimeline', candidates.homeTimeline);
    }
    if (candidates.homeLatestTimeline.length > 0) {
      results.homeLatestTimeline = await findWorkingQueryId('HomeLatestTimeline', candidates.homeLatestTimeline);
    }

    // 步骤3: 如果主页方法失败，使用备选方案
    // 这些是社区常用的 Query ID，可以尝试
    const fallbackIds = {
      homeTimeline: [
        'MpnCeE0hy8m5eWobPx8euw',
        'tQNjW9mIg5LF7lLdkXLr1A',
        '3snsi3LfCylgX6jG6vZlA',
        'HG8YWR0_4Dn6V7YwL0F5Q',
        'L7ZfGmLEqCMT5u_IQlZFMA'
      ],
      homeLatestTimeline: [
        'MpnCeE0hy8m5eWobPx8euw',
        'tQNjW9mIg5LF7lLdkXLr1A',
        '3snsi3LfCylgX6jG6vZlA',
        'HG8YWR0_4Dn6V7YwL0F5Q'
      ]
    };

    if (!results.homeTimeline) {
      console.log('Trying fallback HomeTimeline IDs...');
      results.homeTimeline = await findWorkingQueryId('HomeTimeline', fallbackIds.homeTimeline);
    }

    if (!results.homeLatestTimeline) {
      console.log('Trying fallback HomeLatestTimeline IDs...');
      results.homeLatestTimeline = await findWorkingQueryId('HomeLatestTimeline', fallbackIds.homeLatestTimeline);
    }

    // 步骤4: 返回结果
    if (!results.homeTimeline && !results.homeLatestTimeline) {
      throw new Error('无法找到有效的 Query ID。请检查 Cookie 是否过期，或手动输入 Query ID。');
    }

    return {
      success: true,
      homeTimelineQueryId: results.homeTimeline,
      homeLatestTimelineQueryId: results.homeLatestTimeline,
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
