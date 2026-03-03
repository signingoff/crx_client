import axios from 'axios';

// 根据环境选择 API 地址
const API_BASE = import.meta.env.VITE_API_BASE
  ? `${import.meta.env.VITE_API_BASE}/xueqiu`
  : '/api/xueqiu';

/**
 * 获取用户时间线
 * @param {string|number} userId - 用户ID
 * @param {number} page - 页码
 * @param {number} type - 类型 (1=全部, 2=问答, 4=原创)
 * @returns {Promise<Object>}
 */
export async function fetchUserTimeline(userId, page = 1, type = 1) {
  const response = await axios.get(`${API_BASE}/user/${userId}`, {
    params: { page, type }
  });
  return response.data;
}

/**
 * 获取用户全部历史
 * @param {string|number} userId - 用户ID
 * @param {number} type - 类型
 * @param {number} maxPages - 最大页数
 * @returns {Promise<Object>}
 */
export async function fetchAllTimeline(userId, type = 1, maxPages = 10) {
  const response = await axios.get(`${API_BASE}/user/${userId}/all`, {
    params: { type, maxPages }
  });
  return response.data;
}

/**
 * 获取用户信息
 * @param {string|number} userId - 用户ID
 * @returns {Promise<Object>}
 */
export async function fetchUserInfo(userId) {
  const response = await axios.get(`${API_BASE}/user/${userId}/info`);
  return response.data;
}
