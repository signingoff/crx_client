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
 * 标记单条推文为已读/未读
 * @param {string} tweetId - 推文ID
 * @param {boolean} isRead - 是否已读
 */
export async function markPostAsRead(tweetId, isRead = true) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('read_posts')
      .upsert(
        {
          tweet_id: tweetId,
          is_read: isRead
        },
        {
          onConflict: 'tweet_id'
        }
      );

    if (error) {
      console.error('Error marking post as read:', error);
    }
  } catch (err) {
    console.error('Error in markPostAsRead:', err);
  }
}

/**
 * 检查推文是否已读
 * @param {string} tweetId - 推文ID
 * @returns {Promise<boolean>}
 */
export async function isPostRead(tweetId) {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from('read_posts')
      .select('is_read')
      .eq('tweet_id', tweetId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = 未找到
      console.error('Error checking post read status:', error);
    }

    return !!data?.is_read;
  } catch (err) {
    console.error('Error in isPostRead:', err);
    return false;
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

/**
 * 获取设置值
 * @param {string} key - 设置键名
 * @param {string} defaultValue - 默认值
 * @returns {Promise<string>}
 */
export async function getSetting(key, defaultValue = '') {
  if (!supabase) return defaultValue;
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 未找到，返回默认值
        return defaultValue;
      }
      console.error('Error getting setting:', error);
      return defaultValue;
    }

    return data?.value || defaultValue;
  } catch (err) {
    console.error('Error in getSetting:', err);
    return defaultValue;
  }
}

/**
 * 更新设置值
 * @param {string} key - 设置键名
 * @param {string} value - 设置值
 * @returns {Promise<boolean>}
 */
export async function setSetting(key, value) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('settings')
      .upsert(
        {
          key,
          value,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'key'
        }
      );

    if (error) {
      console.error('Error setting setting:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in setSetting:', err);
    return false;
  }
}

/**
 * 获取所有设置
 * @returns {Promise<Object>}
 */
export async function getAllSettings() {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value, description, updated_at')
      .order('key');

    if (error) {
      console.error('Error getting all settings:', error);
      return {};
    }

    // 转换为对象
    const settings = {};
    data.forEach(item => {
      settings[item.key] = {
        value: item.value,
        description: item.description,
        updatedAt: item.updated_at
      };
    });

    return settings;
  } catch (err) {
    console.error('Error in getAllSettings:', err);
    return {};
  }
}

export default supabase;
