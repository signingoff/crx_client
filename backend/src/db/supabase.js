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

/**
 * 雪球帖子相关功能
 */

function normalizeAvatar(url) {
  if (!url) return ''
  const firstUrl = url.split(',')[0].trim()
  if (!firstUrl) return ''
  return firstUrl.startsWith('http')
    ? firstUrl
    : 'https://xavatar.imedao.com/' + firstUrl + '!240x240.jpg'
}

const XUEQIU_POSTS_TABLE = 'xueqiu_posts';
const XUEQIU_USERS_TABLE = 'xueqiu_users';

let tableChecked = false;
let tableReady = false;

/**
 * 自动创建雪球帖子表（如果不存在）
 * 使用 Supabase Management API 需要额外权限，这里使用备选方案
 */
export async function ensureXueqiuPostsTable() {
  if (!supabase) return false;
  if (tableChecked && tableReady) return true;

  try {
    // 尝试直接插入数据，如果表不存在会报错
    const { error: insertError } = await supabase
      .from(XUEQIU_POSTS_TABLE)
      .insert({
        id: Date.now(),
        user_id: 0,
        text: '__check__',
        created_at: Date.now()
      })
      .single();

    if (!insertError) {
      // 成功插入，清理测试数据
      await supabase.from(XUEQIU_POSTS_TABLE).delete().eq('text', '__check__').eq('user_id', 0);
      tableChecked = true;
      tableReady = true;
      return true;
    }

    console.log('雪球帖子表不存在，插入错误:', insertError.message);
    tableChecked = true;
    tableReady = false;
    return false;
  } catch (err) {
    console.error('检查雪球帖子表失败:', err.message);
    tableChecked = true;
    tableReady = false;
    return false;
  }
}

/**
 * 雪球用户相关功能
 */

let usersTableChecked = false;
let usersTableReady = false;

/**
 * 自动创建雪球用户表（如果不存在）
 */
export async function ensureXueqiuUsersTable() {
  if (!supabase) return false;
  if (usersTableChecked && usersTableReady) return true;

  try {
    const { error: insertError } = await supabase
      .from(XUEQIU_USERS_TABLE)
      .insert({
        id: 0,
        user_id: 0,
        screen_name: '__check__',
        profile_image_url: '__check__',
        description: '__check__',
        followers_count: 0,
        friends_count: 0,
        statuses_count: 0
      });

    if (insertError && insertError.message.includes('does not exist')) {
      console.log('需要创建 xueqiu_users 表，请手动执行:');
      console.log(`
CREATE TABLE xueqiu_users (
  id BIGINT PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  screen_name TEXT,
  profile_image_url TEXT,
  description TEXT,
  followers_count INTEGER DEFAULT 0,
  friends_count INTEGER DEFAULT 0,
  statuses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_xueqiu_users_user_id ON xueqiu_users(user_id);
      `);
      usersTableChecked = true;
      usersTableReady = false;
      return false;
    }

    // 删除测试数据
    await supabase.from(XUEQIU_USERS_TABLE).delete().eq('user_id', 0);
    usersTableChecked = true;
    usersTableReady = true;
    console.log('✓ xueqiu_users 表已就绪');
    return true;
  } catch (err) {
    console.error('检查雪球用户表失败:', err.message);
    usersTableChecked = true;
    usersTableReady = false;
    return false;
  }
}

/**
 * 保存或更新雪球用户信息
 * @param {Object} user - 用户信息
 */
export async function saveXueqiuUser(user) {
  if (!supabase) return false;

  try {
    await ensureXueqiuUsersTable();

    const { error } = await supabase
      .from(XUEQIU_USERS_TABLE)
      .upsert({
        id: user.id || user.user_id,
        user_id: user.user_id || user.id,
        screen_name: user.screen_name,
        profile_image_url: user.profile_image_url,
        description: user.description,
        followers_count: user.followers_count || 0,
        friends_count: user.friends_count || 0,
        statuses_count: user.statuses_count || 0
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('保存雪球用户失败:', err.message);
    return false;
  }
}

/**
 * 获取雪球用户信息
 * @param {number} userId - 用户ID
 */
export async function getXueqiuUser(userId) {
  if (!supabase) return null;

  try {
    await ensureXueqiuUsersTable();

    const { data, error } = await supabase
      .from(XUEQIU_USERS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * 获取所有雪球用户列表
 */
export async function getXueqiuUsers() {
  if (!supabase) return [];

  try {
    await ensureXueqiuUsersTable();

    const { data, error } = await supabase
      .from(XUEQIU_USERS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
}

/**
 * 删除雪球用户
 * @param {number} userId - 用户ID
 */
export async function deleteXueqiuUser(userId) {
  if (!supabase) return false;

  try {
    await ensureXueqiuUsersTable();

    const { error } = await supabase
      .from(XUEQIU_USERS_TABLE)
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('删除雪球用户失败:', err.message);
    return false;
  }
}

/**
 * 保存雪球帖子到数据库
 * @param {Array} posts - 帖子数组
 * @param {number} userId - 用户ID
 * @param {string} userScreenName - 用户名
 */
export async function saveXueqiuPosts(posts, userId, userScreenName) {
  if (!supabase) return false;

  try {
    // 确保表存在
    await ensureXueqiuPostsTable();

    // 准备插入数据
    const insertData = posts.map(post => ({
      id: post.id,
      user_id: post.user?.id || userId,
      text: post.text || '',
      created_at: post.created_at,
      reposts_count: post.reposts_count || 0,
      comments_count: post.comments_count || 0,
      likes_count: post.likes_count || 0,
      source: post.source || '雪球'
    }));

    // upsert 并用 .select('id') 拿回实际插入的行（忽略重复行不返回）
    const { data, error } = await supabase
      .from(XUEQIU_POSTS_TABLE)
      .upsert(insertData, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error('保存雪球帖子失败:', error.message);
      return 0;
    }

    const newCount = data?.length ?? 0;
    console.log(`保存 ${newCount} 条新雪球帖子（提交 ${insertData.length} 条）`);
    return newCount;
  } catch (err) {
    console.error('保存雪球帖子异常:', err.message);
    return 0;
  }
}

/**
 * 获取用户的雪球帖子
 * @param {number} userId - 用户ID
 * @param {number} limit - 数量限制
 */
export async function getXueqiuPosts(userId, limit = 100) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from(XUEQIU_POSTS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取雪球帖子失败:', error.message);
      return [];
    }

    const posts = data || [];
    if (posts.length === 0) return [];

    // Join user avatar
    const { data: userRow, error: userError } = await supabase
      .from(XUEQIU_USERS_TABLE)
      .select('profile_image_url, screen_name')
      .eq('user_id', userId)
      .single()
    if (userError && userError.code !== 'PGRST116') {
      console.error('获取用户头像失败:', userError.message);
    }
    const avatar = normalizeAvatar(userRow?.profile_image_url)
    const screen_name = userRow?.screen_name || ''
    return posts.map(p => ({ ...p, avatar, user_screen_name: screen_name }));
  } catch (err) {
    console.error('获取雪球帖子异常:', err.message);
    return [];
  }
}

/**
 * 获取所有用户的雪球帖子（分页）
 * @param {number} page - 页码（从1开始）
 * @param {number} limit - 每页数量
 */
export async function getAllXueqiuPosts(page = 1, limit = 20) {
  if (!supabase) return { posts: [], total: 0 };

  try {
    const from = (page - 1) * limit;
    const to = page * limit - 1;

    const { data, count, error } = await supabase
      .from(XUEQIU_POSTS_TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const posts = data || [];
    if (posts.length === 0) return { posts: [], total: count || 0 };

    // Join user avatars
    const userIds = [...new Set(posts.map(p => p.user_id))]
    const { data: users, error: usersError } = await supabase
      .from(XUEQIU_USERS_TABLE)
      .select('user_id, profile_image_url, screen_name')
      .in('user_id', userIds)
    if (usersError) {
      console.error('获取用户头像批量失败:', usersError.message);
    }
    const userMap = Object.fromEntries(
      (users || []).map(u => [u.user_id, {
        avatar: normalizeAvatar(u.profile_image_url),
        screen_name: u.screen_name || ''
      }])
    )
    // 只返回用户表中存在的用户的帖子
    const existingUserIds = new Set(users?.map(u => u.user_id) || [])
    const filteredPosts = posts.filter(p => existingUserIds.has(p.user_id))
    return {
      posts: filteredPosts.map(p => ({
        ...p,
        avatar: userMap[p.user_id]?.avatar || '',
        user_screen_name: userMap[p.user_id]?.screen_name || ''
      })),
      total: count ?? posts.length
    };
  } catch (err) {
    console.error('获取所有雪球帖子失败:', err.message);
    return { posts: [], total: 0 };
  }
}

/**
 * 获取用户最新帖子的发布时间（用于增量同步）
 * @param {number} userId - 用户ID
 * @returns {Promise<number|null>} created_at 时间戳（毫秒）
 */
export async function getLatestPostCreatedAt(userId) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from(XUEQIU_POSTS_TABLE)
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.created_at ? new Date(data.created_at).getTime() : null;
  } catch (err) {
    return null;
  }
}

/**
 * 获取指定用户的帖子数
 * @param {number} userId - 用户ID
 * @returns {Promise<number>}
 */
export async function getXueqiuUserPostCount(userId) {
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from(XUEQIU_POSTS_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    return 0;
  }
}

/**
 * 获取所有用户的帖子数统计（逐用户查询，避免全表扫描）
 * @param {number[]} userIds - 用户ID列表
 * @returns {Promise<Object>}
 */
export async function getXueqiuUserPostCounts(userIds = []) {
  if (!supabase) return {};

  try {
    const counts = {};
    await Promise.all(
      userIds.map(async (uid) => {
        counts[uid] = await getXueqiuUserPostCount(uid);
      })
    );
    return counts;
  } catch (err) {
    console.error('获取用户帖子数统计失败:', err.message);
    return {};
  }
}

/**
 * Twitter 推文相关功能
 */
const TWITTER_POSTS_TABLE = 'twitter_posts';

/**
 * 保存 Twitter 推文到数据库
 * @param {Array} posts - 推文数组（已转换为 DB 格式）
 */
export async function saveTwitterPosts(posts) {
  if (!supabase || !posts.length) return false;
  try {
    const { error } = await supabase
      .from(TWITTER_POSTS_TABLE)
      .upsert(posts, { onConflict: 'id', ignoreDuplicates: false });
    if (error) throw error;
    console.log(`保存 ${posts.length} 条 Twitter 推文`);
    return true;
  } catch (err) {
    console.error('保存 Twitter 推文失败:', err.message);
    return false;
  }
}

/**
 * 获取 Twitter 推文（分页）
 * @param {number} page - 页码（从1开始）
 * @param {number} limit - 每页数量
 * @returns {Promise<{posts: Array, total: number}>}
 */
export async function getAllTwitterPosts(page = 1, limit = 20) {
  if (!supabase) return { posts: [], total: 0 };
  try {
    const from = (page - 1) * limit;
    const to = page * limit - 1;
    const { data, count, error } = await supabase
      .from(TWITTER_POSTS_TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return { posts: data || [], total: count || 0 };
  } catch (err) {
    console.error('获取 Twitter 推文失败:', err.message);
    return { posts: [], total: 0 };
  }
}

/**
 * 标记 Twitter 推文已读/未读
 * @param {string} id - 推文 ID
 * @param {boolean} isRead - 是否已读
 */
export async function markTwitterPostRead(id, isRead = true) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from(TWITTER_POSTS_TABLE)
      .update({ is_read: isRead })
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('标记 Twitter 推文已读失败:', err.message);
    return false;
  }
}

/**
 * 标记雪球帖子已读/未读
 * @param {number} id - 帖子 ID
 * @param {boolean} isRead - 是否已读
 * @returns {Promise<boolean>}
 */
export async function markXueqiuPostRead(id, isRead = true) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from(XUEQIU_POSTS_TABLE)
      .update({ is_read: isRead })
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('标记雪球帖子已读失败:', err.message);
    return false;
  }
}

export default supabase;
