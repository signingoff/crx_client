import { getSetting } from '../db/index.js';

// 默认配置
const DEFAULT_CONFIG = {
  homeTimelineQueryId: process.env.HOME_TIMELINE_QUERY_ID || '',
  homeLatestTimelineQueryId: process.env.HOME_LATEST_TIMELINE_QUERY_ID || '',
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
    const [homeQueryId, latestQueryId] = await Promise.all([
      getSetting('HOME_TIMELINE_QUERY_ID', process.env.HOME_TIMELINE_QUERY_ID || ''),
      getSetting('HOME_LATEST_TIMELINE_QUERY_ID', process.env.HOME_LATEST_TIMELINE_QUERY_ID || '')
    ]);

    currentConfig = {
      homeTimelineQueryId: homeQueryId || DEFAULT_CONFIG.homeTimelineQueryId,
      homeLatestTimelineQueryId: latestQueryId || DEFAULT_CONFIG.homeLatestTimelineQueryId,
      updatedAt: new Date().toISOString()
    };

    isInitialized = true;

    console.log('📋 Query ID 配置已加载 (from DB):');
    console.log('   HomeTimeline:', currentConfig.homeTimelineQueryId);
    console.log('   HomeLatestTimeline:', currentConfig.homeLatestTimelineQueryId);

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
      getSetting('X_AUTH_TOKEN', process.env.X_AUTH_TOKEN || ''),
      getSetting('X_CT0', process.env.X_CT0 || ''),
      getSetting('X_BEARER_TOKEN', process.env.X_BEARER_TOKEN || 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA')
    ]);

    return {
      auth_token: authToken,
      ct0: ct0,
      bearer_token: bearerToken
    };
  } catch (err) {
    console.error('从数据库加载 Cookies 失败，使用环境变量:', err.message);
    return {
      auth_token: process.env.X_AUTH_TOKEN || '',
      ct0: process.env.X_CT0 || '',
      bearer_token: process.env.X_BEARER_TOKEN || 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'
    };
  }
}

// 初始化加载
loadConfigFromDB();
