import { getSetting } from '../db/index.js';
import { TWITTER_AUTH_KEYS, DEFAULT_BEARER_TOKEN, QUERY_ID_KEYS, QUERY_TYPES } from './constants.js';

// 默认配置
const DEFAULT_CONFIG = {
  homeLatestTimelineQueryId: process.env[QUERY_ID_KEYS[QUERY_TYPES.FOLLOWING]] || '',
  userTweetsQueryId: process.env[QUERY_ID_KEYS[QUERY_TYPES.USER]] || '',
  userByScreenNameQueryId: process.env[QUERY_ID_KEYS[QUERY_TYPES.USER_BY_SCREEN_NAME]] || '',
  updatedAt: null
};

// 内存中的当前配置
let currentConfig = { ...DEFAULT_CONFIG };
let isInitialized = false;

/**
 * 从数据库加载配置
 */
export async function loadConfigFromDB() {
  try {
    const [latestQueryId, userTweetsQueryId, userByScreenNameQueryId] = await Promise.all([
      getSetting(QUERY_ID_KEYS[QUERY_TYPES.FOLLOWING], process.env[QUERY_ID_KEYS[QUERY_TYPES.FOLLOWING]] || ''),
      getSetting(QUERY_ID_KEYS[QUERY_TYPES.USER], process.env[QUERY_ID_KEYS[QUERY_TYPES.USER]] || ''),
      getSetting(QUERY_ID_KEYS[QUERY_TYPES.USER_BY_SCREEN_NAME], process.env[QUERY_ID_KEYS[QUERY_TYPES.USER_BY_SCREEN_NAME]] || '')
    ]);

    currentConfig = {
      homeLatestTimelineQueryId: latestQueryId || DEFAULT_CONFIG.homeLatestTimelineQueryId,
      userTweetsQueryId: userTweetsQueryId || DEFAULT_CONFIG.userTweetsQueryId,
      userByScreenNameQueryId: userByScreenNameQueryId || DEFAULT_CONFIG.userByScreenNameQueryId,
      updatedAt: new Date().toISOString()
    };

    isInitialized = true;

    console.log('📋 Query ID 配置已加载 (from DB):');
    console.log('   HomeLatestTimeline:', currentConfig.homeLatestTimelineQueryId);
    console.log('   UserTweets:', currentConfig.userTweetsQueryId);
    console.log('   UserByScreenName:', currentConfig.userByScreenNameQueryId);

    return currentConfig;
  } catch (err) {
    console.error('从数据库加载配置失败，使用环境变量:', err.message);
    currentConfig = { ...DEFAULT_CONFIG };
    isInitialized = true;
    return currentConfig;
  }
}

/**
 * 获取当前配置
 */
export function getConfig() {
  if (!isInitialized) {
    // 如果还没初始化，返回默认配置（环境变量）
    return { ...DEFAULT_CONFIG };
  }
  return { ...currentConfig };
}

/**
 * 获取 X.com Cookies（从数据库优先）
 */
export async function getXCookies() {
  try {
    const [authToken, ct0, bearerToken] = await Promise.all([
      getSetting(TWITTER_AUTH_KEYS.X_AUTH_TOKEN, process.env[TWITTER_AUTH_KEYS.X_AUTH_TOKEN] || ''),
      getSetting(TWITTER_AUTH_KEYS.X_CT0, process.env[TWITTER_AUTH_KEYS.X_CT0] || ''),
      getSetting(TWITTER_AUTH_KEYS.X_BEARER_TOKEN, process.env[TWITTER_AUTH_KEYS.X_BEARER_TOKEN] || DEFAULT_BEARER_TOKEN)
    ]);

    return {
      auth_token: authToken,
      ct0: ct0,
      bearer_token: bearerToken
    };
  } catch (err) {
    console.error('从数据库加载 Cookies 失败，使用环境变量:', err.message);
    return {
      auth_token: process.env[TWITTER_AUTH_KEYS.X_AUTH_TOKEN] || '',
      ct0: process.env[TWITTER_AUTH_KEYS.X_CT0] || '',
      bearer_token: process.env[TWITTER_AUTH_KEYS.X_BEARER_TOKEN] || DEFAULT_BEARER_TOKEN
    };
  }
}

// 初始化加载
loadConfigFromDB();
