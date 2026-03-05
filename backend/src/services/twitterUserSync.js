import { getUserTweets } from './xService.js';
import { getTweetUsers, saveTwitterPosts } from '../db/supabase.js';

let syncInterval = null;

/**
 * 启动 Twitter 用户推文同步任务
 * @param {number} intervalMs - 同步间隔（毫秒），默认 5 分钟
 */
export function startTwitterUserSync(intervalMs = 300000) {
  if (syncInterval) {
    console.log('Twitter 用户同步任务已在运行中');
    return;
  }
  console.log(`启动 Twitter 用户同步任务，间隔 ${intervalMs / 1000} 秒`);
  syncTwitterUsers();
  syncInterval = setInterval(syncTwitterUsers, intervalMs);
}

/**
 * 停止 Twitter 用户推文同步任务
 */
export function stopTwitterUserSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Twitter 用户同步任务已停止');
  }
}

/**
 * 同步所有监控用户的推文
 */
async function syncTwitterUsers() {
  try {
    const users = await getTweetUsers();
    if (users.length === 0) {
      console.log('没有需要同步的 Twitter 用户');
      return;
    }
    console.log(`开始同步 ${users.length} 个 Twitter 用户的推文...`);
    for (const user of users) {
      await syncSingleUser(user);
    }
    console.log('Twitter 用户推文同步完成');
  } catch (err) {
    console.error('Twitter 用户同步失败:', err.message);
  }
}

/**
 * 同步单个用户的推文
 */
async function syncSingleUser(user) {
  try {
    const tweets = await getUserTweets(user.user_id, 20);
    if (!tweets.length) {
      console.log(`  ○ ${user.screen_name || user.user_id}: 无推文`);
      return;
    }

    const dbPosts = tweets.map(tweet => ({
      tweet_id: tweet.id,
      text: tweet.text,
      created_at: new Date(tweet.createdAt).toISOString(),
      user_id: user.user_id,
      user_name: tweet.author?.name || user.screen_name || '',
      user_screen_name: tweet.author?.username || user.screen_name || '',
      avatar_url: tweet.author?.avatar || user.profile_image_url || '',
      replies_count: tweet.metrics?.replies || 0,
      retweets_count: tweet.metrics?.retweets || 0,
      likes_count: tweet.metrics?.likes || 0,
      media: tweet.media?.length ? tweet.media : null,
      entities: tweet.entities || null,
      article: tweet.article || null,
      is_for_you: false,
    }));

    await saveTwitterPosts(dbPosts);
    console.log(`  ✓ ${user.screen_name || user.user_id}: 同步 ${dbPosts.length} 条`);
  } catch (err) {
    console.error(`  ✗ 用户 ${user.user_id} 同步失败:`, err.message);
  }
}

/**
 * 手动触发一次同步
 */
export async function triggerTwitterUserSync() {
  await syncTwitterUsers();
  return { success: true, message: 'Twitter 用户同步已触发' };
}
