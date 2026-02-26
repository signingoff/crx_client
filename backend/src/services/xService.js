import axios from 'axios';
import { xCookies } from '../config/auth.js';
import { isBlacklisted } from '../config/blacklist.js';

const X_API_BASE = 'https://x.com/i/api/graphql';

// HomeTimeline GraphQL query ID (这个ID可能会变化，需要定期更新)
const HOME_TIMELINE_QUERY_ID = 'MpnCeE0hy8m5eWobPx8euw';

/**
 * 获取 For You 页面的推文
 * @param {number} count - 获取推文数量
 * @returns {Promise<Array>} 推文列表
 */
export async function getForYouTweets(count = 20) {
  const url = `${X_API_BASE}/${HOME_TIMELINE_QUERY_ID}/HomeTimeline`;

  const headers = {
    'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'x-csrf-token': xCookies.ct0,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-client-language': 'en',
    'cookie': `auth_token=${xCookies.auth_token}; ct0=${xCookies.ct0}`,
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'referer': 'https://x.com/home',
    'origin': 'https://x.com'
  };

  const variables = {
    count,
    includePromotedContent: true,
    latestControlAvailable: true,
    requestContext: 'home',
    withCommunity: true,
    withDownvotePerspective: false,
    withReactionsMetadata: false,
    withReactionsPerspective: false,
    withSuperFollowsUserFields: true
  };

  const features = {
    blue_business_profile_image_shape_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    responsive_web_home_pinned_timelines_enabled: true,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    tweetypie_unmention_optimization_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: false,
    tweet_awards_web_tipping_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_include_grok_learning_analyzing: false,
    tweet_with_visibility_results_include_grok_analyzed_label: false,
    responsive_web_media_download_video_enabled: false
  };

  try {
    const response = await axios.get(url, {
      headers,
      params: {
        variables: JSON.stringify(variables),
        features: JSON.stringify(features)
      }
    });

    const tweets = parseTweets(response.data);
    // 过滤掉日语推文和黑名单用户的推文
    return tweets.filter(tweet => {
      const isJapanese = isJapaneseText(tweet.text);
      const isBlocked = isBlacklisted(tweet.author?.id, tweet.author?.username);
      return !isJapanese && !isBlocked;
    });
  } catch (error) {
    console.error('Error fetching For You tweets:', error.response?.data || error.message);
    throw new Error('Failed to fetch For You tweets. Please check your cookies.');
  }
}

/**
 * 检测文本是否为日语
 * @param {string} text - 推文文本
 * @returns {boolean} 是否包含日文字符
 */
function isJapaneseText(text) {
  if (!text) return false;
  // 检测平假名和片假名
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  return japaneseRegex.test(text);
}

/**
 * 解析 X API 响应，提取推文数据
 * @param {Object} data - API 响应数据
 * @returns {Array} 格式化后的推文列表
 */
function parseTweets(data) {
  const tweets = [];

  const instructions = data?.data?.home?.home_timeline_urt?.instructions || [];

  for (const instruction of instructions) {
    if (instruction.type === 'TimelineAddEntries') {
      for (const entry of instruction.entries || []) {
        const tweet = extractTweetFromEntry(entry);
        if (tweet) {
          tweets.push(tweet);
        }
      }
    }
  }

  return tweets;
}

/**
 * 从 entry 中提取推文信息
 * @param {Object} entry - Timeline entry
 * @returns {Object|null} 推文对象
 */
function extractTweetFromEntry(entry) {
  const content = entry?.content;
  if (!content) return null;

  // 处理普通推文
  const itemContent = content.itemContent;
  if (itemContent?.tweet_results?.result) {
    return formatTweet(itemContent.tweet_results.result);
  }

  return null;
}

/**
 * 格式化推文数据
 * @param {Object} tweetData - 原始推文数据
 * @returns {Object} 格式化后的推文
 */
function formatTweet(tweetData) {
  const tweet = tweetData.legacy || tweetData;
  const user = tweetData.core?.user_results?.result || {};
  const userCore = user.core || {};

  // 获取长推文完整文本（超过 280 字符）
  // 尝试多个可能的路径
  const noteTweetText = tweetData.note_tweet?.note_tweet_results?.result?.text
    || tweetData.result?.note_tweet?.note_tweet_results?.result?.text
    || tweet.note_tweet?.note_tweet_results?.result?.text;

  // 获取完整文本，优先使用长推文文本
  const fullText = noteTweetText || tweet.full_text || tweet.text || '';

  // 判断是否为长推文：有 noteTweetText 或者文本超过 280 字符
  const isLongText = !!noteTweetText || fullText.length > 280;

  return {
    id: tweet.id_str,
    text: fullText,
    isLongText,
    createdAt: tweet.created_at,
    author: {
      id: tweet.user_id_str,
      name: userCore.name,
      username: userCore.screen_name,
      avatar: user.avatar?.image_url?.replace('_normal', '')
    },
    metrics: {
      replies: tweet.reply_count,
      retweets: tweet.retweet_count,
      likes: tweet.favorite_count,
      views: tweetData.views?.count
    },
    media: extractMedia(tweet),
    entities: tweet.entities
  };
}

/**
 * 提取媒体信息
 * @param {Object} tweet - 推文数据
 * @returns {Array} 媒体列表
 */
function extractMedia(tweet) {
  const media = tweet.extended_entities?.media || tweet.entities?.media || [];
  return media.map(m => ({
    type: m.type, // photo, video, animated_gif
    url: m.media_url_https,
    displayUrl: m.display_url,
    video_info: m.video_info
  }));
}
