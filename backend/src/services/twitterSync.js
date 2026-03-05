import { getFollowingTweets, getUserTweets } from './xService.js';
import { saveTwitterPosts, getTweetUsers } from '../db/supabase.js';

let followingInterval = null;
let userInterval = null;

/**
 * 启动 Twitter 推文后台同步任务（Following + 监控用户，统一间隔）
 * @param {number} intervalMs - 同步间隔（毫秒），默认 2 分钟
 */
export function startTwitterSync(intervalMs = 120000) {
  if (followingInterval || userInterval) {
    console.log('Twitter 同步任务已在运行中');
    return;
  }
  console.log(`启动 Twitter 同步任务，间隔 ${intervalMs / 1000} 秒`);
  syncFollowingTimeline();
  syncTwitterUsers();
  followingInterval = setInterval(syncFollowingTimeline, intervalMs);
  userInterval = setInterval(syncTwitterUsers, intervalMs);
}

/**
 * 停止 Twitter 推文同步任务
 */
export function stopTwitterSync() {
  if (followingInterval) {
    clearInterval(followingInterval);
    followingInterval = null;
  }
  if (userInterval) {
    clearInterval(userInterval);
    userInterval = null;
  }
  console.log('Twitter 同步任务已停止');
}

/**
 * 同步 Following timeline
 */
async function syncFollowingTimeline() {
  try {
    console.log('开始同步 Twitter Following 推文...');
    const count = 30;

    const followingTweets = await getFollowingTweets(count);
    const uniqueMap = new Map();
    for (const tweet of followingTweets) {
      if (!uniqueMap.has(tweet.id)) uniqueMap.set(tweet.id, tweet);
    }
    const uniqueTweets = Array.from(uniqueMap.values());

    // 转换为 DB 格式
    const dbPosts = uniqueTweets.map(tweet => ({
      tweet_id: tweet.id,
      text: tweet.text,
      created_at: new Date(tweet.createdAt).toISOString(),
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
    console.log(`✓ 同步 ${uniqueTweets.length} 条 Twitter Following 推文`);
  } catch (err) {
    console.error('Twitter Following 同步失败:', err.message);
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
 * 同步单个监控用户的推文
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
 * 手动触发一次 Following 同步
 */
export async function triggerTwitterSync() {
  await syncFollowingTimeline();
  return { success: true, message: 'Twitter Following 同步已触发' };
}

/**
 * 手动触发一次用户监控同步
 */
export async function triggerTwitterUserSync() {
  await syncTwitterUsers();
  return { success: true, message: 'Twitter 用户同步已触发' };
}
