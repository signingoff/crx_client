import express from 'express';
import { getAllTwitterPosts, markTwitterPostRead, getTweetUsers, saveTweetUser, deleteTweetUser } from '../db/supabase.js';
import { triggerTwitterSync } from '../services/twitterSync.js';
import { triggerTwitterUserSync } from '../services/twitterUserSync.js';

const router = express.Router();

/**
 * GET /api/twitter/posts?page=1&limit=20
 * 分页读取 Twitter 推文
 */
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const forYouOnly = req.query.forYouOnly === 'true';
    const { posts, total } = await getAllTwitterPosts(page, limit, forYouOnly);
    res.json({
      success: true,
      data: { posts, total, page, hasMore: page * limit < total }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/twitter/posts/:id/read
 * 标记推文已读/未读
 * Body: { isRead: boolean }
 */
router.post('/posts/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead = true } = req.body;
    const ok = await markTwitterPostRead(id, isRead);
    if (!ok) return res.status(500).json({ success: false, error: '更新失败，请检查数据库' });
    res.json({ success: true, isRead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/twitter/sync
 * 手动触发同步
 */
router.post('/sync', async (req, res) => {
  try {
    const result = await triggerTwitterSync();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/twitter/users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await getTweetUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/twitter/users
 * Body: { user_id, screen_name, profile_image_url, description }
 */
router.post('/users', async (req, res) => {
  try {
    const { user_id, screen_name, profile_image_url, description } = req.body;
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }
    const ok = await saveTweetUser({ user_id: String(user_id), screen_name, profile_image_url, description });
    if (!ok) return res.status(500).json({ success: false, error: '保存失败' });
    // 后台触发一次同步
    triggerTwitterUserSync().catch(err => console.error('同步失败:', err.message));
    res.json({ success: true, message: '用户添加成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/twitter/users/:userId
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const ok = await deleteTweetUser(userId);
    if (!ok) return res.status(500).json({ success: false, error: '删除失败' });
    res.json({ success: true, message: '用户删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/twitter/users/sync
 * 手动触发 Twitter 用户同步
 */
router.post('/users/sync', async (req, res) => {
  try {
    const result = await triggerTwitterUserSync();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
