import { getSetting } from '../db/index.js';
import xueqiuService from './xueqiuService.js';
import { saveXueqiuPosts, saveXueqiuUser, getXueqiuUsers } from '../db/supabase.js';

let syncInterval = null;

/**
 * 开始雪球帖子同步任务
 * @param {number} intervalMs - 同步间隔（毫秒），默认 10 秒
 */
export function startXueqiuSync(intervalMs = 10000) {
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
 * 同步单个用户
 */
async function syncSingleUser(targetUserId) {
  try {
    console.log(`同步用户 ${targetUserId}...`);

    const allPosts = [];

    // 尝试获取所有页面的数据，直到没有更多
    const maxPages = 50; // 最多获取50页
    for (let page = 1; page <= maxPages; page++) {
      try {
        const result = await xueqiuService.getUserTimeline(targetUserId, page, 1);

        console.log(`用户 ${targetUserId} 第 ${page} 页: ${result.statuses?.length || 0} 条`);

        if (result.statuses && result.statuses.length > 0) {
          // 使用 parseTimelineResponse 处理数据
          const parsed = xueqiuService.parseTimelineResponse(result);
          allPosts.push(...parsed.statuses);
        } else {
          console.log(`用户 ${targetUserId} 共 ${allPosts.length} 条，无更多数据`);
          break;
        }
      } catch (e) {
        console.log(`获取第 ${page} 页失败: ${e.message}`);
        break;
      }
    }
    console.log(`用户 ${targetUserId} 共 ${allPosts.length} 条`);

    if (allPosts.length > 0) {
      // 保存到数据库，去掉 -雪球 后缀
      let userScreenName = allPosts[0]?.user?.screen_name || targetUserId.toString();
      userScreenName = userScreenName.replace(/\s*[-–]\s*雪球$/, '').trim();

      // 保存用户信息
      const userInfo = allPosts[0]?.user;
      if (userInfo) {
        await saveXueqiuUser({
          id: userInfo.id || parseInt(targetUserId),
          user_id: parseInt(targetUserId),
          screen_name: userScreenName,
          profile_image_url: userInfo.profile_image_url,
          description: userInfo.description,
          followers_count: userInfo.followers_count,
          friends_count: userInfo.friends_count,
          statuses_count: userInfo.statuses_count
        });
      }

      await saveXueqiuPosts(allPosts, parseInt(targetUserId), userScreenName);
      console.log(`  ✓ ${userScreenName}: ${allPosts.length} 条帖子`);
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
