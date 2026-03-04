import express from 'express';
import { getAllTwitterPosts, markTwitterPostRead } from '../db/supabase.js';
import { triggerTwitterSync } from '../services/twitterSync.js';

const router = express.Router();

/**
 * GET /api/twitter/posts?page=1&limit=20
 * 分页读取 Twitter 推文
 */
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const { posts, total } = await getAllTwitterPosts(page, limit);
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

export default router;
