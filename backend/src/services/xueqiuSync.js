import xueqiuService from './xueqiuService.js';
import { saveXueqiuPosts, saveXueqiuUser, getXueqiuUsers, getLatestPostCreatedAt } from '../db/supabase.js';

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
    } else {
      const userIds = users.map(u => u.user_id.toString());
      console.log(`开始同步 ${userIds.length} 个雪球用户的帖子...`);
      for (const targetUserId of userIds) {
        await syncSingleUser(targetUserId);
      }
    }

    // 同步首页 feed
    await syncHomeTimeline();

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

    // 首次同步（DB 中无任何帖子）才需要多翻页；增量同步固定拉少量页即可
    const hasExistingPosts = await getLatestPostCreatedAt(parseInt(targetUserId));
    const isFirstSync = !hasExistingPosts;

    let apiUserInfo = null;
    let totalNew = 0;

    // 首次同步最多 50 页；增量同步逐页 upsert，整页全重复即停（无上限安全帽 10 页）
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
      if (statuses.length === 0) break;

      const parsed = xueqiuService.parseTimelineResponse(result);

      if (page === 1 && parsed.statuses.length > 0) {
        apiUserInfo = parsed.statuses[0]?.user || null;
      }

      const userScreenName = apiUserInfo
        ? (apiUserInfo.screen_name || targetUserId.toString()).replace(/\s*[-–]\s*雪球$/, '').trim()
        : targetUserId.toString();

      // 逐页 upsert，返回本页实际新增数
      const pageNew = await saveXueqiuPosts(parsed.statuses, parseInt(targetUserId), userScreenName);
      totalNew += pageNew;

      // 增量同步：本页全为重复 → 后面也不会有新帖，提前停止
      if (!isFirstSync && pageNew === 0) {
        console.log(`用户 ${targetUserId} 第 ${page} 页全为已有帖子，停止翻页`);
        break;
      }
    }

    const userScreenName = apiUserInfo
      ? (apiUserInfo.screen_name || targetUserId.toString()).replace(/\s*[-–]\s*雪球$/, '').trim()
      : targetUserId.toString();

    // 无论有无新帖，始终更新用户信息（含 profile_image_url）
    if (apiUserInfo) {
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

    if (totalNew > 0) {
      console.log(`  ✓ ${userScreenName}: 新增 ${totalNew} 条`);
    } else {
      console.log(`  ○ ${userScreenName}: 无新帖子`);
    }
  } catch (err) {
    console.error(`  ✗ 用户 ${targetUserId} 失败:`, err.message);
  }
}

/**
 * 同步雪球首页 feed（关注的人的帖子）
 */
async function syncHomeTimeline() {
  try {
    console.log('同步雪球首页 feed...');
    const result = await xueqiuService.getHomeTimeline(20);
    const parsed = xueqiuService.parseTimelineResponse(result);

    if (parsed.statuses.length === 0) {
      console.log('  ○ 首页 feed 无新内容');
      return;
    }

    const newCount = await saveXueqiuPosts(parsed.statuses, 0, '');
    console.log(`  ✓ 首页 feed 新增 ${newCount} 条`);
  } catch (err) {
    console.error('首页 feed 同步失败:', err.message);
  }
}

/**
 * 手动触发一次同步
 */
export async function triggerSync() {
  await syncXueqiuPosts();
  return { success: true, message: '同步已触发' };
}
