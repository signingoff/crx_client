import express from 'express';
import xueqiuService from '../services/xueqiuService.js';
import { ensureXueqiuPostsTable, getXueqiuPosts, getXueqiuUsers, getXueqiuUser, ensureXueqiuUsersTable, saveXueqiuUser, deleteXueqiuUser, getXueqiuUserPostCounts } from '../db/supabase.js';
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

    // 优先从用户表获取头像
    let avatar = '';
    const user = await getXueqiuUser(parseInt(userId));
    if (user?.profile_image_url) {
      let url = user.profile_image_url;
      if (!url.startsWith('http')) {
        const firstUrl = url.split(',')[0];
        avatar = 'https://xavatar.imedao.com/' + firstUrl + '!240x240.jpg';
      } else {
        avatar = url;
      }
    }

    // 为每个帖子添加头像
    const postsWithAvatar = posts.map(post => ({
      ...post,
      avatar: post.avatar || avatar
    }));

    res.json({
      success: true,
      data: postsWithAvatar
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

/**
 * 获取所有雪球用户列表
 * GET /api/xueqiu/users
 */
router.get('/users', async (req, res) => {
  try {
    await ensureXueqiuUsersTable();
    const users = await getXueqiuUsers();

    // 一次性获取所有用户的帖子数
    const postCounts = await getXueqiuUserPostCounts();

    // 直接返回用户表中的数据
    const result = users.map(u => ({
      id: u.user_id,
      user_id: u.user_id,
      screen_name: u.screen_name || '',
      profile_image_url: u.profile_image_url || '',
      description: u.description || '',
      followers_count: u.followers_count || 0,
      friends_count: u.friends_count || 0,
      statuses_count: u.statuses_count || 0,
      postCount: postCounts[u.user_id] || 0
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取单个雪球用户详情
 * GET /api/xueqiu/user-detail/:userId
 */
router.get('/user-detail/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getXueqiuUser(parseInt(userId));

    if (user) {
      res.json({
        success: true,
        data: user
      });
    } else {
      // 如果数据库没有，尝试从API获取
      const userInfo = await xueqiuService.getUserInfoByScreenName(userId);
      res.json({
        success: true,
        data: userInfo
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 添加雪球用户
 * POST /api/xueqiu/users
 * Body: { user_id: number, screen_name: string, ... }
 */
router.post('/users', async (req, res) => {
  try {
    const { user_id, screen_name, profile_image_url, description, followers_count, friends_count, statuses_count } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    const user = {
      id: user_id,
      user_id: parseInt(user_id),
      screen_name: screen_name || '',
      profile_image_url: profile_image_url || '',
      description: description || '',
      followers_count: followers_count || 0,
      friends_count: friends_count || 0,
      statuses_count: statuses_count || 0
    };

    const result = await saveXueqiuUser(user);

    // 触发同步
    await triggerSync();

    res.json({
      success: result,
      message: result ? '用户添加成功' : '用户添加失败'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 删除雪球用户
 * DELETE /api/xueqiu/users/:userId
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await deleteXueqiuUser(parseInt(userId));

    res.json({
      success: result,
      message: result ? '用户删除成功' : '用户删除失败'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
