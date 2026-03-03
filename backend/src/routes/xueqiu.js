import express from 'express';
import xueqiuService from '../services/xueqiuService.js';
import { ensureXueqiuPostsTable, getXueqiuPosts } from '../db/supabase.js';
import { triggerSync } from '../services/xueqiuSync.js';

const router = express.Router();

/**
 * 获取用户时间线 - 单页
 * GET /api/xueqiu/user/:userId?page=1&type=1
 */
router.get('/user/:userId', async (req, res) => {
  try {
    let { userId } = req.params;
    const { page = 1, type = 1 } = req.query;

    // 如果 userId 不是纯数字，尝试获取用户信息
    if (!/^\d+$/.test(userId)) {
      console.log('尝试获取用户信息:', userId);
      try {
        const userInfo = await xueqiuService.getUserInfoByScreenName(userId);
        if (userInfo && userInfo.id) {
          userId = userInfo.id;
          console.log('获取到用户ID:', userId);
        }
      } catch (e) {
        console.log('获取用户ID失败，使用原值');
      }
    }

    console.log('请求用户ID:', userId, 'page:', page, 'type:', type);
    const response = await xueqiuService.getUserTimeline(userId, parseInt(page), parseInt(type));
    const parsed = xueqiuService.parseTimelineResponse(response);

    res.json({
      success: true,
      data: {
        statuses: parsed.statuses,
        maxPage: parsed.maxPage,
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    console.error('获取用户时间线失败:', err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data?.error || err.message
    });
  }
});

/**
 * 获取用户全部历史（分页获取）
 * GET /api/xueqiu/user/:userId/all
 */
router.get('/user/:userId/all', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 1, maxPages = 10 } = req.query;

    const allStatuses = [];
    let currentPage = 1;
    let maxPage = 1;

    // 递归获取所有页面
    while (currentPage <= maxPage && currentPage <= parseInt(maxPages)) {
      const response = await xueqiuService.getUserTimeline(userId, currentPage, parseInt(type));
      const parsed = xueqiuService.parseTimelineResponse(response);

      allStatuses.push(...parsed.statuses);
      maxPage = parsed.maxPage;

      // 没有更多数据了
      if (parsed.statuses.length === 0) {
        break;
      }

      currentPage++;
    }

    res.json({
      success: true,
      data: {
        statuses: allStatuses,
        totalPages: maxPage,
        fetchedPages: currentPage - 1
      }
    });
  } catch (err) {
    console.error('获取全部历史失败:', err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data?.error || err.message
    });
  }
});

/**
 * 获取用户信息
 * GET /api/xueqiu/user/:userId/info
 */
router.get('/user/:userId/info', async (req, res) => {
  try {
    const { userId } = req.params;

    // 尝试通过雪球 API 获取用户信息
    const userInfo = await xueqiuService.getUserInfoByScreenName(userId);

    res.json({
      success: true,
      data: userInfo
    });
  } catch (err) {
    console.error('获取用户信息失败:', err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data?.error || err.message
    });
  }
});

/**
 * 初始化雪球帖子表
 * GET /api/xueqiu/init
 */
router.get('/init', async (req, res) => {
  try {
    const result = await ensureXueqiuPostsTable();
    res.json({
      success: result,
      message: result ? '雪球帖子表初始化完成' : '初始化失败'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 手动触发同步
 * GET /api/xueqiu/sync
 */
router.get('/sync', async (req, res) => {
  try {
    const result = await triggerSync();
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取已保存的雪球帖子
 * GET /api/xueqiu/saved/:userId
 */
router.get('/saved/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await getXueqiuPosts(parseInt(userId), 500);
    res.json({
      success: true,
      data: posts
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 健康检查
 * GET /api/xueqiu/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '雪球网 API 服务正常',
    cookieConfigured: !!process.env.XUEQIU_COOKIE
  });
});

export default router;
