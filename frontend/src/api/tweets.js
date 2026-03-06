import axios from 'axios'

// 根据环境选择 API 地址
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

/**
 * 获取 Query ID 配置
 */
export async function getQueryConfig() {
  const response = await axios.get(`${API_BASE}/tweets/queryid-config`)
  return response.data
}

/**
 * 更新 Query ID
 * @param {'home' | 'following'} type - 类型
 * @param {string} queryId - 新的 Query ID
 */
export async function updateQueryId(type, queryId) {
  const response = await axios.post(`${API_BASE}/tweets/queryid-config`, {
    type,
    queryId
  })
  return response.data
}
