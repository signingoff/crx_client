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
