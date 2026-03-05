import axios from 'axios';
import { getConfig, getXCookies, loadConfigFromDB } from '../config/settingsConfig.js';

const X_API_BASE = 'https://x.com/i/api/graphql';

// 配置加载标志
let configLoaded = false;

/**
 * 获取当前 Query ID
 */
function getQueryId(type) {
  const config = getConfig();
  if (type === 'user') return config.userTweetsQueryId;
  if (type === 'userByScreenName') return config.userByScreenNameQueryId;
  return config.homeLatestTimelineQueryId;
}

/**
 * 获取 Following 页面的推文
 * @param {number} count - 获取推文数量
 * @returns {Promise<Array>} 推文列表
 */
export async function getFollowingTweets(count = 20) {
  // 懒加载配置
  if (!configLoaded) {
    await loadConfigFromDB();
    configLoaded = true;
  }

  const queryId = getQueryId('following');
  const url = `${X_API_BASE}/${queryId}/HomeLatestTimeline`;

  // 从数据库获取最新的 cookies
  const cookies = await getXCookies();

  const headers = {
    'authorization': `Bearer ${cookies.bearer_token}`,
    'x-csrf-token': cookies.ct0,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-client-language': 'en',
    'cookie': `auth_token=${cookies.auth_token}; ct0=${cookies.ct0}`,
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
    requestContext: 'following',
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
    return tweets.filter(tweet => !isJapaneseText(tweet.text) && !isKoreanText(tweet.text));
  } catch (error) {
    console.error('Error fetching Following tweets:', error.response?.data || error.message);
    // 如果失败，返回空数组，不中断流程
    return [];
  }
}

/**
 * 获取指定用户的推文
 * @param {string} userId - 用户的数字 ID（字符串形式）
 * @param {number} count - 获取数量
 * @returns {Promise<Array>}
 */
export async function getUserTweets(userId, count = 20) {
  if (!configLoaded) {
    await loadConfigFromDB();
    configLoaded = true;
  }

  const queryId = getQueryId('user');
  if (!queryId) {
    console.warn('USER_TWEETS_QUERY_ID 未配置，跳过用户 timeline 抓取');
    return [];
  }

  const url = `${X_API_BASE}/${queryId}/UserTweets`;
  const cookies = await getXCookies();

  const headers = {
    'authorization': `Bearer ${cookies.bearer_token}`,
    'x-csrf-token': cookies.ct0,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-client-language': 'en',
    'cookie': `auth_token=${cookies.auth_token}; ct0=${cookies.ct0}`,
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'referer': `https://x.com/`,
    'origin': 'https://x.com'
  };

  const variables = {
    userId,
    count,
    includePromotedContent: true,
    withQuickPromoteEligibilityTweetFields: true,
    withVoice: true
  };

  const features = {
    rweb_video_screen_enabled: false,
    profile_label_improvements_pcf_label_in_post_enabled: true,
    responsive_web_profile_redirect_enabled: false,
    rweb_tipjar_consumption_enabled: false,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    premium_content_api_read_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: false,
    responsive_web_grok_analyze_post_followups_enabled: true,
    responsive_web_jetfuel_frame: true,
    responsive_web_grok_share_attachment_enabled: true,
    responsive_web_grok_annotations_enabled: true,
    articles_preview_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    content_disclosure_indicator_enabled: true,
    content_disclosure_ai_generated_indicator_enabled: true,
    responsive_web_grok_show_grok_translated_post: true,
    responsive_web_grok_analysis_button_from_backend: true,
    post_ctas_fetch_enabled: true,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_grok_image_annotation_enabled: true,
    responsive_web_grok_imagine_annotation_enabled: true,
    responsive_web_grok_community_note_auto_translation_is_enabled: false,
    responsive_web_enhance_cards_enabled: false
  };

  const fieldToggles = {
    withArticlePlainText: false
  };

  try {
    const response = await axios.get(url, {
      headers,
      params: {
        variables: JSON.stringify(variables),
        features: JSON.stringify(features),
        fieldToggles: JSON.stringify(fieldToggles)
      }
    });
    return parseUserTweets(response.data);
  } catch (error) {
    console.error(`[DEBUG] 获取用户 ${userId} 推文失败:`, {
      status: error.response?.status,
      data: error.response?.data,
      queryId
    });
    return [];
  }
}

/**
 * 解析 UserTweets API 响应
 */
function parseUserTweets(data) {
  const tweets = [];
  const instructions =
    data?.data?.user?.result?.timeline_v2?.timeline?.instructions ||
    data?.data?.user?.result?.timeline?.timeline?.instructions ||
    [];

  for (const instruction of instructions) {
    if (instruction.type === 'TimelineAddEntries') {
      for (const entry of instruction.entries || []) {
        const tweet = extractTweetFromEntry(entry);
        if (tweet) tweets.push(tweet);
      }
    }
  }
  return tweets;
}

/**
 * 通过 screen_name 获取 Twitter 用户 ID
 * 使用 X GraphQL UserByScreenName 接口（与 auth_token cookie 兼容）
 * @param {string} screenName - 用户名（不含 @）
 * @returns {Promise<{id: string, name: string, username: string}|null>}
 */
export async function getUserByScreenName(screenName) {
  if (!configLoaded) {
    await loadConfigFromDB();
    configLoaded = true;
  }

  const queryId = getQueryId('userByScreenName');
  if (!queryId) {
    console.warn('USER_BY_SCREEN_NAME_QUERY_ID 未配置，无法通过用户名查找用户');
    return null;
  }

  const cookies = await getXCookies();
  const url = `${X_API_BASE}/${queryId}/UserByScreenName`;

  const variables = {
    screen_name: screenName,
    withSafetyModeUserFields: true
  };

  const features = {
    hidden_profile_likes_enabled: false,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    subscriptions_verification_info_is_identity_verified_enabled: false,
    subscriptions_verification_info_verified_since_enabled: true,
    highlights_tweets_tab_ui_enabled: true,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_graphql_timeline_navigation_enabled: true
  };

  try {
    const headers = {
      'authorization': `Bearer ${cookies.bearer_token}`,
      'x-csrf-token': cookies.ct0,
      'x-twitter-active-user': 'yes',
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-client-language': 'en',
      'cookie': `auth_token=${cookies.auth_token}; ct0=${cookies.ct0}`,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'accept-encoding': 'gzip, deflate, br',
      'referer': 'https://x.com/',
      'origin': 'https://x.com',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin'
    };

    console.log('[DEBUG] UserByScreenName 请求:', {
      url: url.replace(cookies.bearer_token?.slice(-10) || '', '...'),
      headers: {
        'x-csrf-token': headers['x-csrf-token']?.slice(-10) + '...',
        'cookie': headers['cookie']?.replace(/auth_token=[^;]+/, 'auth_token=...')
      }
    });

    const response = await axios.get(url, {
      headers,
      params: {
        variables: JSON.stringify(variables),
        features: JSON.stringify(features)
      }
    });

    const result = response.data?.data?.user?.result;
    if (!result) return null;
    const legacy = result.legacy || {};
    return {
      id: result.rest_id || legacy.id_str,
      name: legacy.name,
      username: result.core?.screen_name || legacy.screen_name,
      description: legacy.description,
      profile_image_url: result.avatar?.image_url?.replace('_normal', '')
    };
  } catch (error) {
    console.error(`[DEBUG] 查询用户 @${screenName} 失败:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers_sent: {
        bearer_token_length: cookies.bearer_token?.length,
        ct0_length: cookies.ct0?.length,
        auth_token_length: cookies.auth_token?.length
      }
    });
    return null;
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
 * 检测文本是否为韩语
 * @param {string} text - 推文文本
 * @returns {boolean} 是否包含韩文字符
 */
function isKoreanText(text) {
  if (!text) return false;
  // 检测谚文音节、谚文字母、谚文兼容字母
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
  return koreanRegex.test(text);
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
 * @returns {Object|null} 格式化后的推文，如果数据无效则返回 null
 */
function formatTweet(tweetData) {
  const tweet = tweetData.legacy || tweetData;
  const user = tweetData.core?.user_results?.result || {};

  // 用户信息分散在两个位置：
  // - user.legacy: description, followers_count, friends_count
  // - user.core: name, screen_name, location, created_at
  const userLegacy = user.legacy || {};
  const userCore = user.core || {};

  // 获取长推文完整文本（超过 280 字符）
  // 尝试多个可能的路径
  const noteTweetText = tweetData.note_tweet?.note_tweet_results?.result?.text
    || tweetData.result?.note_tweet?.note_tweet_results?.result?.text
    || tweet.note_tweet?.note_tweet_results?.result?.text;

  // 获取完整文本，优先使用长推文文本
  const fullText = noteTweetText || tweet.full_text || tweet.text || '';

  // 获取作者 ID
  const authorId = tweet.user_id_str || userCore.id_str || userCore.id;

  // 过滤条件：text 为空 或 author.id 为空
  if (!fullText.trim()) {
    return null;
  }
  if (!authorId) {
    return null;
  }

  // 判断是否为长推文：有 noteTweetText 或者文本超过 280 字符
  const isLongText = !!noteTweetText || fullText.length > 280;

  // 提取文章信息（X Articles / Twitter Articles）
  // 先从 tweetData.article 查找，再从 entities.urls 中的文章链接提取
  let article = extractArticle(tweetData);
  if (!article) {
    article = extractArticleFromUrls(tweet.entities, fullText);
  }

  return {
    id: tweet.id_str,
    text: fullText,
    isLongText,
    article,
    createdAt: tweet.created_at,
    author: {
      id: authorId,
      name: userCore.name,
      username: userCore.screen_name,
      avatar: user.avatar?.image_url?.replace('_normal', ''),
      description: userLegacy.description,
      location: userCore.location,
      createdAt: userCore.created_at,
      followingCount: userLegacy.friends_count,
      followersCount: userLegacy.followers_count
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
 * 提取文章信息（X Articles / Twitter Articles）
 * @param {Object} tweetData - 原始推文数据
 * @returns {Object|null} 文章信息
 */
function extractArticle(tweetData) {
  // 文章可能嵌套在多个位置
  const articleData = tweetData.article?.article_results?.result
    || tweetData.twitter_article?.twitter_article_results?.result
    || tweetData.note_tweet?.note_tweet_results?.result?.article;

  if (!articleData) return null;

  // 提取文章标题
  const title = articleData.title
    || articleData.headline
    || articleData.preview_text
    || '文章';

  // 提取文章链接
  const articleId = articleData.id_str || articleData.id;
  let url = null;

  if (articleId) {
    // 构建文章链接
    url = `https://x.com/i/articles/${articleId}`;
  }

  // 如果有 cover media，提取封面图
  const coverMedia = articleData.cover_media?.media_results?.result?.media_url_https
    || articleData.cover_media?.media_url_https;

  return {
    id: articleId,
    title: title,
    url: url,
    coverImage: coverMedia,
    description: articleData.preview_text || null
  };
}

/**
 * 从 entities.urls 中提取文章链接信息
 * X.com 文章链接格式: x.com/i/article/123456789
 * @param {Object} entities - 推文 entities
 * @param {string} fullText - 推文完整文本
 * @returns {Object|null} 文章信息
 */
function extractArticleFromUrls(entities, fullText) {
  if (!entities?.urls || entities.urls.length === 0) return null;

  for (const url of entities.urls) {
    const expandedUrl = url.expanded_url || '';
    // 匹配 x.com/i/article/ 或 twitter.com/i/article/ 格式的链接
    const articleMatch = expandedUrl.match(/(?:x\.com|twitter\.com)\/i\/(?:article|articles)\/(\d+)/);
    if (articleMatch) {
      const articleId = articleMatch[1];
      // 从 display_url 或 expanded_url 提取文章标题（如果可能）
      // 或使用链接中的文字作为标题
      const displayUrl = url.display_url || '';
      // 尝试从 display_url 提取标题（x.com 有时会显示文章标题）
      let title = displayUrl;

      // 如果 display_url 只是短链接形式（如 x.com/i/article/2027…），尝试从文本中提取
      if (title.includes('…') || title.includes('x.com/i/article')) {
        // 尝试多种方式查找链接在文本中的位置
        // url.url 可能是 t.co 短链接，而 fullText 中可能是 expanded_url 或 display_url
        let urlIndex = fullText.indexOf(url.url);

        // 如果没找到短链接，尝试找 expanded_url
        if (urlIndex === -1 && url.expanded_url) {
          urlIndex = fullText.indexOf(url.expanded_url);
        }

        // 还是没找到，尝试找 display_url
        if (urlIndex === -1 && url.display_url) {
          urlIndex = fullText.indexOf(url.display_url);
        }

        if (urlIndex !== -1) {
          const afterUrl = fullText.slice(urlIndex + (url.expanded_url || url.url).length).trim();
          if (afterUrl && afterUrl.length > 0 && afterUrl.length < 200) {
            title = afterUrl.split('\n')[0].slice(0, 100);
          } else {
            title = 'X 文章';
          }
        } else {
          title = 'X 文章';
        }
      }

      return {
        id: articleId,
        title: title,
        url: expandedUrl,
        coverImage: null,
        description: null
      };
    }
  }

  return null;
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
