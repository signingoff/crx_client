import express from 'express';
import { getXueqiuPosts, getAllXueqiuPosts, getXueqiuUsers, ensureXueqiuUsersTable, saveXueqiuUser, deleteXueqiuUser, getXueqiuUserPostCounts, markXueqiuPostRead } from '../db/supabase.js';
import { triggerSync } from '../services/xueqiuSync.js';

const router = express.Router();

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

    // 按用户 ID 逐个 count 查询，避免全表扫描
    const userIds = users.map(u => u.user_id);
    const postCounts = await getXueqiuUserPostCounts(userIds);

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

    // 后台异步触发同步，不阻塞响应
    triggerSync().catch(err => console.error('同步失败:', err.message));

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
 * 获取所有用户的聚合帖子（分页）
 * GET /api/xueqiu/posts?page=1&limit=20
 */
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const { posts, total } = await getAllXueqiuPosts(page, limit);

    res.json({
      success: true,
      data: {
        posts,
        total,
        page,
        hasMore: page * limit < total
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 标记雪球帖子已读/未读
 * POST /api/xueqiu/posts/:id/read
 * Body: { isRead: boolean }
 */
router.post('/posts/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead = true } = req.body;
    const ok = await markXueqiuPostRead(parseInt(id), isRead);
    if (!ok) return res.status(500).json({ success: false, error: '更新失败，请检查数据库' });
    res.json({ success: true, isRead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
