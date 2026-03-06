import { Router } from 'express';
import { setSetting } from '../db/index.js';
import { getConfig, loadConfigFromDB } from '../config/settingsConfig.js';
import { VALID_QUERY_TYPES, QUERY_ID_KEYS } from '../config/constants.js';

const router = Router();

/**
 * GET /api/tweets/queryid-config
 * 获取当前 Query ID 配置
 */
router.get('/queryid-config', (req, res) => {
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
 * POST /api/tweets/queryid-config
 * 更新 Query ID
 * Body: { type: 'following' | 'user' | 'userByScreenName', queryId: string }
 */
router.post('/queryid-config', async (req, res) => {
  const { type, queryId } = req.body;

  if (!type || !queryId) {
    return res.status(400).json({
      success: false,
      error: '需要提供 type (following/user/userByScreenName) 和 queryId'
    });
  }

  try {
    if (!VALID_QUERY_TYPES.includes(type)) {
      throw new Error(`无效的类型: ${type}。必须是: ${VALID_QUERY_TYPES.join(', ')}`);
    }

    const key = QUERY_ID_KEYS[type];

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

export default router;
