import { getSetting, setSetting } from '../db/index.js';
import xueqiuService from './xueqiuService.js';
import { saveXueqiuPosts } from '../db/supabase.js';

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
    // 获取目标用户ID
    const targetUserId = await getSetting('XUEQIU_TARGET_USER_ID', '');

    if (!targetUserId) {
      // console.log('未设置雪球目标用户，跳过同步');
      return;
    }

    console.log(`开始同步雪球用户 ${targetUserId} 的帖子...`);

    // 获取用户所有页面的帖子
    const allPosts = [];

    // 尝试获取前几页数据
    for (let page = 1; page <= 5; page++) {
      try {
        const result = await xueqiuService.getUserTimeline(targetUserId, page, 1);

        if (result.statuses && result.statuses.length > 0) {
          allPosts.push(...result.statuses);

          // 如果没有更多页面，退出
          if (!result.maxPage || page >= result.maxPage) {
            break;
          }
        } else {
          break;
        }
      } catch (e) {
        console.log(`获取第 ${page} 页失败:`, e.message);
        break;
      }
    }

    if (allPosts.length > 0) {
      // 保存到数据库
      const userScreenName = allPosts[0]?.user?.screen_name || targetUserId.toString();
      await saveXueqiuPosts(allPosts, parseInt(targetUserId), userScreenName);
      console.log(`同步完成: 用户 ${userScreenName}, 共 ${allPosts.length} 条帖子`);
    } else {
      console.log(`用户 ${targetUserId} 没有新帖子`);
    }
  } catch (err) {
    console.error('雪球同步失败:', err.message);
  }
}

/**
 * 手动触发一次同步
 */
export async function triggerSync() {
  await syncXueqiuPosts();
  return { success: true, message: '同步已触发' };
}
