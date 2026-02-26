import { Router } from 'express';
import { getForYouTweets } from '../services/xService.js';
import { getBlacklist, addToBlacklist, removeFromBlacklist } from '../config/blacklist.js';

const router = Router();

/**
 * GET /api/tweets/for-you
 * 获取 For You 页面的推文
 */
router.get('/for-you', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20;
    const tweets = await getForYouTweets(count);

    res.json({
      success: true,
      count: tweets.length,
      data: tweets
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
 * GET /api/tweets/blacklist
 * 获取黑名单列表
 */
router.get('/blacklist', (req, res) => {
  res.json({
    success: true,
    data: getBlacklist()
  });
});

/**
 * POST /api/tweets/blacklist
 * 添加用户到黑名单
 * Body: { userId?: string, username?: string }
 */
router.post('/blacklist', (req, res) => {
  const { userId, username } = req.body;

  if (!userId && !username) {
    return res.status(400).json({
      success: false,
      error: '需要提供 userId 或 username'
    });
  }

  addToBlacklist(userId, username);

  res.json({
    success: true,
    message: '已添加到黑名单',
    data: getBlacklist()
  });
});

/**
 * DELETE /api/tweets/blacklist
 * 从黑名单移除用户
 * Body: { userId?: string, username?: string }
 */
router.delete('/blacklist', (req, res) => {
  const { userId, username } = req.body;

  if (!userId && !username) {
    return res.status(400).json({
      success: false,
      error: '需要提供 userId 或 username'
    });
  }

  removeFromBlacklist(userId, username);

  res.json({
    success: true,
    message: '已从黑名单移除',
    data: getBlacklist()
  });
});

export default router;
