import axios from 'axios'

// 根据环境选择 API 地址
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

/**
 * 获取 Query ID 配置
 */
export async function getQueryConfig() {
  const response = await axios.get(`${API_BASE}/tweets/config`)
  return response.data
}

/**
 * 更新 Query ID
 * @param {'home' | 'following'} type - 类型
 * @param {string} queryId - 新的 Query ID
 */
export async function updateQueryId(type, queryId) {
  const response = await axios.post(`${API_BASE}/tweets/config/query-id`, {
    type,
    queryId
  })
  return response.data
}

/**
 * 自动从 X.com 获取 Query ID
 */
export async function fetchQueryIdFromX() {
  const response = await axios.post(`${API_BASE}/tweets/config/fetch-query-id`)
  return response.data
}

/**
 * 标记 Twitter 推文已读/未读
 * @param {string} id - 推文 ID
 * @param {boolean} isRead - 是否已读
 */
export async function markTwitterPostRead(id, isRead) {
  const response = await axios.post(`${API_BASE}/twitter/posts/${id}/read`, { isRead })
  return response.data
}

/**
 * 标记雪球帖子已读/未读
 * @param {string|number} id - 帖子 ID
 * @param {boolean} isRead - 是否已读
 */
export async function markXueqiuPostRead(id, isRead) {
  const response = await axios.post(`${API_BASE}/xueqiu/posts/${id}/read`, { isRead })
  return response.data
}
