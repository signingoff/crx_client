import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // 使用 service_role key，绕过 RLS

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('⚠️ Supabase 环境变量未配置，相关功能将不可用');
}

/**
 * 检查推文是否已加载
 * @param {string} tweetId - 推文ID
 * @returns {Promise<boolean>}
 */
export async function isPostLoaded(tweetId) {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from('read_posts')
      .select('tweet_id')
      .eq('tweet_id', tweetId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = 未找到
      console.error('Error checking post loaded:', error);
    }

    return !!data;
  } catch (err) {
    console.error('Error in isPostLoaded:', err);
    return false;
  }
}

/**
 * 批量标记推文为已加载
 * @param {string[]} tweetIds - 推文ID数组
 */
export async function markPostsAsLoaded(tweetIds) {
  if (!supabase || !tweetIds || tweetIds.length === 0) return;

  try {
    const rows = tweetIds.map(id => ({
      tweet_id: id,
      is_read: false,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('read_posts')
      .upsert(rows, {
        onConflict: 'tweet_id',
        ignoreDuplicates: true
      });

    if (error) {
      console.error('Error marking posts as loaded:', error);
    }
  } catch (err) {
    console.error('Error in markPostsAsLoaded:', err);
  }
}

/**
 * 标记单条推文为已读/未读
 * @param {string} tweetId - 推文ID
 * @param {boolean} isRead - 是否已读
 */
export async function markPostAsRead(tweetId, isRead = true) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('read_posts')
      .update({ is_read: isRead })
      .eq('tweet_id', tweetId);

    if (error) {
      console.error('Error marking post as read:', error);
    }
  } catch (err) {
    console.error('Error in markPostAsRead:', err);
  }
}

/**
 * 获取已读/未读统计
 * @returns {Promise<{total: number, read: number, unread: number}>}
 */
export async function getReadStats() {
  if (!supabase) return { total: 0, read: 0, unread: 0 };
  try {
    // 获取总数
    const { count: total, error: totalError } = await supabase
      .from('read_posts')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // 获取已读数
    const { count: read, error: readError } = await supabase
      .from('read_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', true);

    if (readError) throw readError;

    return {
      total: total || 0,
      read: read || 0,
      unread: (total || 0) - (read || 0)
    };
  } catch (err) {
    console.error('Error in getReadStats:', err);
    return { total: 0, read: 0, unread: 0 };
  }
}

export default supabase;
