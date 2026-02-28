import { Router } from 'express';
import { getForYouTweets, getFollowingTweets } from '../services/xService.js';
import {
  markPostAsRead,
  getReadStats
} from '../db/index.js';
import { getConfig, updateQueryId } from '../config/queryConfig.js';
import { fetchQueryIdsFromX } from '../services/queryIdFetcher.js';

const router = Router();

/**
 * GET /api/tweets/for-you
 * 获取 For You 和 Following 页面的推文，合并后返回
 */
router.get('/for-you', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20;

    // 并行获取 For You 和 Following 的推文
    const [forYouTweets, followingTweets] = await Promise.all([
      getForYouTweets(count),
      getFollowingTweets(count)
    ]);

    // 合并推文
    const allTweets = [...forYouTweets, ...followingTweets];

    // 根据 tweet.id 去重
    const uniqueTweetsMap = new Map();
    for (const tweet of allTweets) {
      if (!uniqueTweetsMap.has(tweet.id)) {
        uniqueTweetsMap.set(tweet.id, tweet);
      }
    }

    // 转换为数组并按时间排序（最新的在前）
    const uniqueTweets = Array.from(uniqueTweetsMap.values()).sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      count: uniqueTweets.length,
      sources: {
        forYou: forYouTweets.length,
        following: followingTweets.length
      },
      data: uniqueTweets
    });
  } catch (error) {
    console.error('Error in /for-you route:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tweets/health
 * 健康检查
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running'
  });
});

/**
 * POST /api/tweets/mark-read
 * 标记推文为已读/未读（连续单击3次时调用）
 * Body: { tweetId: string, isRead: boolean }
 */
router.post('/mark-read', async (req, res) => {
  const { tweetId, isRead } = req.body;

  if (!tweetId) {
    return res.status(400).json({
      success: false,
      error: '需要提供 tweetId'
    });
  }

  const readStatus = isRead !== false; // 默认为 true
  await markPostAsRead(tweetId, readStatus);
  const stats = await getReadStats();

  res.json({
    success: true,
    message: readStatus ? '已标记为已读' : '已标记为未读',
    isRead: readStatus,
    stats
  });
});

/**
 * GET /api/tweets/read-stats
 * 获取已读/未读统计
 */
router.get('/read-stats', async (req, res) => {
  const stats = await getReadStats();
  res.json({
    success: true,
    data: stats
  });
});

/**
 * POST /api/tweets/read-status
 * 批量查询推文的已读状态
 * Body: { tweetIds: string[] }
 */
router.post('/read-status', async (req, res) => {
  try {
    const { tweetIds } = req.body;

    if (!Array.isArray(tweetIds) || tweetIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '需要提供 tweetIds 数组'
      });
    }

    // 查询每个推文的已读状态
    const statusMap = {};
    for (const tweetId of tweetIds) {
      const isRead = await isPostRead(tweetId);
      statusMap[tweetId] = isRead;
    }

    res.json({
      success: true,
      data: statusMap
    });
  } catch (error) {
    console.error('Error fetching read status:', error);
    res.status(500).json({
      success: false,
      error: error.message || '查询已读状态失败'
    });
  }
});

/**
 * GET /api/tweets/config
 * 获取当前 Query ID 配置
 */
router.get('/config', (req, res) => {
  const config = getConfig();
  res.json({
    success: true,
    data: {
      homeTimelineQueryId: config.homeTimelineQueryId,
      homeLatestTimelineQueryId: config.homeLatestTimelineQueryId,
      updatedAt: config.updatedAt
    }
  });
});

/**
 * POST /api/tweets/config/query-id
 * 更新 Query ID
 * Body: { type: 'home' | 'following', queryId: string }
 */
router.post('/config/query-id', (req, res) => {
  const { type, queryId } = req.body;

  if (!type || !queryId) {
    return res.status(400).json({
      success: false,
      error: '需要提供 type (home/following) 和 queryId'
    });
  }

  try {
    const config = updateQueryId(type, queryId);
    res.json({
      success: true,
      message: `已更新 ${type} 的 Query ID`,
      data: {
        homeTimelineQueryId: config.homeTimelineQueryId,
        homeLatestTimelineQueryId: config.homeLatestTimelineQueryId,
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
    if (result.homeTimelineQueryId) {
      updateQueryId('home', result.homeTimelineQueryId);
      updates.push(`HomeTimeline: ${result.homeTimelineQueryId}`);
    }
    if (result.homeLatestTimelineQueryId) {
      updateQueryId('following', result.homeLatestTimelineQueryId);
      updates.push(`HomeLatestTimeline: ${result.homeLatestTimelineQueryId}`);
    }

    console.log('✅ Query IDs updated:', updates.join(', '));

    const config = getConfig();
    res.json({
      success: true,
      message: 'Query IDs 自动获取并更新成功',
      data: {
        homeTimelineQueryId: config.homeTimelineQueryId,
        homeLatestTimelineQueryId: config.homeLatestTimelineQueryId,
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
