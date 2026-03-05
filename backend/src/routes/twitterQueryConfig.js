import { Router } from 'express';
import { setSetting } from '../db/index.js';
import { getConfig, loadConfigFromDB } from '../config/settingsConfig.js';
import { fetchQueryIdsFromX } from '../services/queryIdFetcher.js';

const router = Router();

/**
 * GET /api/tweets/config
 * 获取当前 Query ID 配置
 */
router.get('/config', (req, res) => {
  const config = getConfig();
  res.json({
    success: true,
    data: {
      homeLatestTimelineQueryId: config.homeLatestTimelineQueryId,
      userTweetsQueryId: config.userTweetsQueryId,
      userByScreenNameQueryId: config.userByScreenNameQueryId,
      updatedAt: config.updatedAt
    }
  });
});

/**
 * POST /api/tweets/config/query-id
 * 更新 Query ID
 * Body: { type: 'following' | 'user' | 'userByScreenName', queryId: string }
 */
router.post('/config/query-id', async (req, res) => {
  const { type, queryId } = req.body;

  if (!type || !queryId) {
    return res.status(400).json({
      success: false,
      error: '需要提供 type (following/user/userByScreenName) 和 queryId'
    });
  }

  try {
    const validTypes = ['following', 'user', 'userByScreenName'];
    if (!validTypes.includes(type)) {
      throw new Error(`无效的类型: ${type}。必须是: ${validTypes.join(', ')}`);
    }

    const key = type === 'user'
      ? 'USER_TWEETS_QUERY_ID'
      : type === 'userByScreenName'
        ? 'USER_BY_SCREEN_NAME_QUERY_ID'
        : 'HOME_LATEST_TIMELINE_QUERY_ID';

    await setSetting(key, queryId);
    await loadConfigFromDB();

    const config = getConfig();
    res.json({
      success: true,
      message: `已更新 ${type} 的 Query ID`,
      data: {
        homeLatestTimelineQueryId: config.homeLatestTimelineQueryId,
        userTweetsQueryId: config.userTweetsQueryId,
        userByScreenNameQueryId: config.userByScreenNameQueryId,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/tweets/config/fetch-query-id
 * 自动从 X.com 获取并更新 Query ID
 */
router.post('/config/fetch-query-id', async (req, res) => {
  try {
    console.log('🔄 Auto-fetching Query IDs from X.com...');
    const result = await fetchQueryIdsFromX();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // 更新配置
    const updates = [];
    if (result.homeLatestTimelineQueryId) {
      await setSetting('HOME_LATEST_TIMELINE_QUERY_ID', result.homeLatestTimelineQueryId);
      updates.push(`HomeLatestTimeline: ${result.homeLatestTimelineQueryId}`);
    }
    if (result.userTweetsQueryId) {
      await setSetting('USER_TWEETS_QUERY_ID', result.userTweetsQueryId);
      updates.push(`UserTweets: ${result.userTweetsQueryId}`);
    }
    if (result.userByScreenNameQueryId) {
      await setSetting('USER_BY_SCREEN_NAME_QUERY_ID', result.userByScreenNameQueryId);
      updates.push(`UserByScreenName: ${result.userByScreenNameQueryId}`);
    }

    // 重新加载配置
    await loadConfigFromDB();
    console.log('✅ Query IDs updated:', updates.join(', '));

    const config = getConfig();
    res.json({
      success: true,
      message: 'Query IDs 自动获取并更新成功',
      data: {
        homeLatestTimelineQueryId: config.homeLatestTimelineQueryId,
        userTweetsQueryId: config.userTweetsQueryId,
        userByScreenNameQueryId: config.userByScreenNameQueryId,
        updatedAt: config.updatedAt,
        source: 'auto-fetch'
      }
    });
  } catch (error) {
    console.error('Error in auto-fetch:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
