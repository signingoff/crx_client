import { getForYouTweets, getFollowingTweets } from './xService.js';
import { saveTwitterPosts } from '../db/supabase.js';

let syncInterval = null;

/**
 * 启动 Twitter 推文后台同步任务
 * @param {number} intervalMs - 同步间隔（毫秒），默认 5 分钟
 */
export function startTwitterSync(intervalMs = 300000) {
  if (syncInterval) {
    console.log('Twitter 同步任务已在运行中');
    return;
  }
  console.log(`启动 Twitter 同步任务，间隔 ${intervalMs / 1000} 秒`);
  syncTwitterPosts();
  syncInterval = setInterval(syncTwitterPosts, intervalMs);
}

/**
 * 停止 Twitter 推文同步任务
 */
export function stopTwitterSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Twitter 同步任务已停止');
  }
}

/**
 * 执行一次 Twitter 推文同步
 */
async function syncTwitterPosts() {
  try {
    console.log('开始同步 Twitter 推文...');
    const count = 30;

    const [forYouTweets, followingTweets] = await Promise.all([
      getForYouTweets(count),
      getFollowingTweets(count)
    ]);

    // 合并去重
    const allTweets = [...forYouTweets, ...followingTweets];
    const uniqueMap = new Map();
    for (const tweet of allTweets) {
      if (!uniqueMap.has(tweet.id)) uniqueMap.set(tweet.id, tweet);
    }
    const uniqueTweets = Array.from(uniqueMap.values());

    // 转换为 DB 格式
    const dbPosts = uniqueTweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      created_at: new Date(tweet.createdAt).getTime(),
      user_id: tweet.author?.id || tweet.author?.username || '',
      user_name: tweet.author?.name || '',
      user_screen_name: tweet.author?.username || '',
      avatar_url: tweet.author?.avatar || '',
      replies_count: tweet.metrics?.replies || 0,
      retweets_count: tweet.metrics?.retweets || 0,
      likes_count: tweet.metrics?.likes || 0,
      media: tweet.media?.length ? tweet.media : null,
      entities: tweet.entities || null,
      article: tweet.article || null,
    }));

    await saveTwitterPosts(dbPosts);
    console.log(`✓ 同步 ${uniqueTweets.length} 条 Twitter 推文`);
  } catch (err) {
    console.error('Twitter 同步失败:', err.message);
  }
}

/**
 * 手动触发一次同步
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function triggerTwitterSync() {
  await syncTwitterPosts();
  return { success: true, message: 'Twitter 同步已触发' };
}
