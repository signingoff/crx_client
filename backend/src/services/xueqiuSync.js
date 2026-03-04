import xueqiuService from './xueqiuService.js';
import { saveXueqiuPosts, saveXueqiuUser, getXueqiuUsers, getLatestPostId } from '../db/supabase.js';

let syncInterval = null;

/**
 * 开始雪球帖子同步任务
 * @param {number} intervalMs - 同步间隔（毫秒），默认 5 分钟
 */
export function startXueqiuSync(intervalMs = 300000) {
  if (syncInterval) {
    console.log('雪球同步任务已在运行中');
    return;
  }

  console.log(`启动雪球帖子同步任务，间隔 ${intervalMs / 1000} 秒`);

  // 立即执行一次
  syncXueqiuPosts();

  // 设置定时任务
  syncInterval = setInterval(syncXueqiuPosts, intervalMs);
}

/**
 * 停止雪球帖子同步任务
 */
export function stopXueqiuSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('雪球同步任务已停止');
  }
}

/**
 * 同步雪球帖子
 */
async function syncXueqiuPosts() {
  try {
    // 从用户表获取用户列表
    const users = await getXueqiuUsers();

    if (users.length === 0) {
      console.log('没有需要同步的雪球用户');
      return;
    }

    const userIds = users.map(u => u.user_id.toString());

    console.log(`开始同步 ${userIds.length} 个雪球用户的帖子...`);

    // 遍历每个用户
    for (const targetUserId of userIds) {
      await syncSingleUser(targetUserId);
    }

    console.log(`批量同步完成`);
  } catch (err) {
    console.error('雪球同步失败:', err.message);
  }
}

/**
 * 同步单个用户（增量同步：遇到已存在的帖子即停止翻页）
 */
async function syncSingleUser(targetUserId) {
  try {
    console.log(`同步用户 ${targetUserId}...`);

    // 获取数据库中该用户最新帖子 ID，用于增量判断
    const latestKnownId = await getLatestPostId(parseInt(targetUserId));
    const isFirstSync = !latestKnownId;

    const newPosts = [];
    let reachedKnown = false;
    let apiUserInfo = null;

    // 首次同步最多50页，增量同步最多10页（新帖子不会超过10页）
    const maxPages = isFirstSync ? 50 : 10;

    for (let page = 1; page <= maxPages; page++) {
      let result;
      try {
        result = await xueqiuService.getUserTimeline(targetUserId, page, 1);
      } catch (e) {
        console.log(`获取第 ${page} 页失败: ${e.message}`);
        break;
      }

      const statuses = result.statuses || [];
      console.log(`用户 ${targetUserId} 第 ${page} 页: ${statuses.length} 条`);

      if (statuses.length === 0) {
        break;
      }

      // 第一页时记录用户信息
      if (page === 1 && statuses.length > 0) {
        apiUserInfo = statuses[0]?.user || null;
      }

      const parsed = xueqiuService.parseTimelineResponse(result);

      for (const post of parsed.statuses) {
        // 遇到已知帖子（ID <= latestKnownId）说明后面都是旧数据，停止
        if (latestKnownId && post.id <= latestKnownId) {
          reachedKnown = true;
          break;
        }
        newPosts.push(post);
      }

      if (reachedKnown) {
        console.log(`用户 ${targetUserId} 已追上最新同步位置，停止翻页`);
        break;
      }
    }

    console.log(`用户 ${targetUserId} 新增 ${newPosts.length} 条`);

    // 无论有无新帖，始终更新用户信息（含 profile_image_url）
    if (apiUserInfo) {
      const userScreenName = (apiUserInfo.screen_name || targetUserId.toString())
        .replace(/\s*[-–]\s*雪球$/, '').trim();
      await saveXueqiuUser({
        id: apiUserInfo.id || parseInt(targetUserId),
        user_id: parseInt(targetUserId),
        screen_name: userScreenName,
        profile_image_url: apiUserInfo.profile_image_url,
        description: apiUserInfo.description,
        followers_count: apiUserInfo.followers_count,
        friends_count: apiUserInfo.friends_count,
        statuses_count: apiUserInfo.statuses_count
      });
    }

    if (newPosts.length > 0) {
      const userScreenName = apiUserInfo
        ? (apiUserInfo.screen_name || targetUserId.toString()).replace(/\s*[-–]\s*雪球$/, '').trim()
        : targetUserId.toString();
      await saveXueqiuPosts(newPosts, parseInt(targetUserId), userScreenName);
      console.log(`  ✓ ${userScreenName}: 新增 ${newPosts.length} 条`);
    } else {
      console.log(`  ○ 用户 ${targetUserId}: 无新帖子`);
    }
  } catch (err) {
    console.error(`  ✗ 用户 ${targetUserId} 失败:`, err.message);
  }
}

/**
 * 手动触发一次同步
 */
export async function triggerSync() {
  await syncXueqiuPosts();
  return { success: true, message: '同步已触发' };
}
