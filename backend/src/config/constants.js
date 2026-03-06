/**
 * Query ID 相关常量
 */

// Query 类型枚举
export const QUERY_TYPES = {
  FOLLOWING: 'following',
  USER: 'user',
  USER_BY_SCREEN_NAME: 'userByScreenName'
};

// Query 类型对应的数据库 setting key
export const QUERY_ID_KEYS = {
  [QUERY_TYPES.FOLLOWING]: 'HOME_LATEST_TIMELINE_QUERY_ID',
  [QUERY_TYPES.USER]: 'USER_TWEETS_QUERY_ID',
  [QUERY_TYPES.USER_BY_SCREEN_NAME]: 'USER_BY_SCREEN_NAME_QUERY_ID'
};

// 有效的 Query 类型数组
export const VALID_QUERY_TYPES = Object.values(QUERY_TYPES);

// X Cookie 环境变量名
export const TWITTER_AUTH_KEYS = {
  X_AUTH_TOKEN: 'X_AUTH_TOKEN',
  X_CT0: 'X_CT0',
  X_BEARER_TOKEN: 'X_BEARER_TOKEN'
};

// 默认 Bearer Token
export const DEFAULT_BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
