import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'

/**
 * 获取 For You 页面的推文
 * @param {number} count - 获取数量
 */
export async function fetchForYouTweets(count = 20) {
  const response = await axios.get(`${API_BASE}/tweets/for-you`, {
    params: { count, t: Date.now() }
  })
  return response.data
}

/**
 * 标记单条推文为已读（双击卡片时调用）
 * @param {string} tweetId - 推文ID
 */
export async function markTweetAsRead(tweetId) {
  if (!tweetId) return
  const response = await axios.post(`${API_BASE}/tweets/mark-read`, {
    tweetId,
    isRead: true
  })
  return response.data
}

/**
 * 标记单条推文为未读
 * @param {string} tweetId - 推文ID
 */
export async function markTweetAsUnread(tweetId) {
  if (!tweetId) return
  const response = await axios.post(`${API_BASE}/tweets/mark-read`, {
    tweetId,
    isRead: false
  })
  return response.data
}

/**
 * 获取已读/未读统计
 */
export async function getReadStats() {
  const response = await axios.get(`${API_BASE}/tweets/read-stats`)
  return response.data
}

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
