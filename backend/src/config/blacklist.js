import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLACKLIST_FILE = path.join(__dirname, 'blacklist.json');

// 默认黑名单配置
let blacklist = {
  users: [],      // 用户ID列表
  usernames: []   // 用户名列表（不含@）
};

/**
 * 加载黑名单配置
 */
export function loadBlacklist() {
  try {
    if (fs.existsSync(BLACKLIST_FILE)) {
      const data = fs.readFileSync(BLACKLIST_FILE, 'utf8');
      blacklist = JSON.parse(data);
      console.log('✅ 黑名单已加载:', blacklist.users.length, '个用户ID,', blacklist.usernames.length, '个用户名');
    } else {
      saveBlacklist();
      console.log('✅ 创建新的黑名单文件');
    }
  } catch (error) {
    console.error('❌ 加载黑名单失败:', error.message);
  }
}

/**
 * 保存黑名单配置
 */
export function saveBlacklist() {
  try {
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2));
  } catch (error) {
    console.error('❌ 保存黑名单失败:', error.message);
  }
}

/**
 * 检查用户是否在黑名单中
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @returns {boolean} 是否在黑名单中
 */
export function isBlacklisted(userId, username) {
  return blacklist.users.includes(userId) ||
         blacklist.usernames.includes(username?.toLowerCase());
}

/**
 * 添加用户到黑名单
 * @param {string} userId - 用户ID（可选）
 * @param {string} username - 用户名（可选）
 */
export function addToBlacklist(userId, username) {
  if (userId && !blacklist.users.includes(userId)) {
    blacklist.users.push(userId);
  }
  if (username && !blacklist.usernames.includes(username.toLowerCase())) {
    blacklist.usernames.push(username.toLowerCase());
  }
  saveBlacklist();
}

/**
 * 从黑名单移除用户
 * @param {string} userId - 用户ID（可选）
 * @param {string} username - 用户名（可选）
 */
export function removeFromBlacklist(userId, username) {
  if (userId) {
    blacklist.users = blacklist.users.filter(id => id !== userId);
  }
  if (username) {
    blacklist.usernames = blacklist.usernames.filter(u => u !== username.toLowerCase());
  }
  saveBlacklist();
}

/**
 * 获取黑名单列表
 */
export function getBlacklist() {
  return { ...blacklist };
}

// 初始化加载
loadBlacklist();
