<template>
  <div class="xueqiu">
    <header class="header">
      <h1>❄️ 雪球网发言</h1>
      <div class="header-actions">
        <router-link to="/" class="nav-link" title="返回 X For You">
          🔙
        </router-link>
      </div>
    </header>

    <!-- Cookie 配置 -->
    <div class="cookie-bar">
      <span class="cookie-tip">❄️ 使用 Puppeteer 无头浏览器绕过反爬</span>
    </div>

    <!-- 用户输入区 -->
    <div class="search-bar">
      <input
        v-model="userId"
        type="text"
        placeholder="输入雪球用户ID（如 2958699535）"
        class="user-input"
        @keyup.enter="handleSearch"
      />
      <select v-model="contentType" class="type-select">
        <option :value="1">全部</option>
        <option :value="4">原创</option>
        <option :value="2">问答</option>
      </select>
      <button class="check-cookie-btn" @click="checkHealth" title="检查Cookie">
        ✓
      </button>
      <button class="search-btn" @click="handleSearch" :disabled="loading">
        {{ loading ? '加载中...' : '搜索' }}
      </button>
      <button v-if="hasMore && !loadingAll" class="load-more-btn" @click="loadMore">
        加载更多
      </button>
      <button v-if="loadingAll" class="load-more-btn" disabled>
        加载中...
      </button>
    </div>

    <!-- 用户信息 -->
    <div v-if="userInfo" class="user-info">
      <img :src="getAvatarUrl(userInfo.profile_image_url)" :alt="userInfo.screen_name" class="avatar" />
      <div class="user-details">
        <h3>{{ userInfo.screen_name }}</h3>
        <p v-if="userInfo.description">{{ userInfo.description }}</p>
        <div class="user-stats">
          <span>关注 {{ userInfo.friends_count }}</span>
          <span>粉丝 {{ userInfo.followers_count }}</span>
          <span>发帖 {{ userInfo.statuses_count }}</span>
        </div>
      </div>
    </div>

    <!-- 发言列表 -->
    <div class="content">
      <div v-if="loading && posts.length === 0" class="loading">
        加载中...
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <div v-else-if="posts.length === 0 && !loading" class="empty">
        请输入用户ID搜索发言
      </div>
      <div v-else class="post-list">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-card"
        >
          <!-- 用户信息 -->
          <div class="post-header">
            <img
              v-if="post.user"
              :src="getAvatarUrl(post.user.profile_image_url)"
              :alt="post.user.screen_name"
              class="post-avatar"
            />
            <div class="post-user-info">
              <span class="post-username">{{ post.user?.screen_name }}</span>
              <span class="post-time">{{ formatTime(post.created_at) }}</span>
            </div>
          </div>

          <!-- 转发标识 -->
          <div v-if="post.retweet" class="retweet-badge">
            🔄 转发
          </div>

          <!-- 内容 -->
          <div class="post-text" v-html="parseText(post.text)"></div>

          <!-- 媒体图片 -->
          <div v-if="post.photos && post.photos.length > 0" class="post-images">
            <div
              v-for="(photo, index) in post.photos"
              :key="index"
              class="image-wrapper"
            >
              <img :src="photo.small" :alt="'图片' + (index + 1)" loading="lazy" />
            </div>
          </div>

          <!-- 股票标的 -->
          <div v-if="post.symbols && post.symbols.length > 0" class="post-symbols">
            <span v-for="symbol in post.symbols" :key="symbol.symbol" class="symbol-tag">
              ${{ symbol.name }}
            </span>
          </div>

          <!-- 统计数据 -->
          <div class="post-stats">
            <span>💬 {{ post.comments_count || 0 }}</span>
            <span>🔄 {{ post.reposts_count || 0 }}</span>
            <span>❤️ {{ post.likes_count || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchUserTimeline, fetchUserInfo, fetchAllTimeline } from '../api/xueqiu.js'
import axios from 'axios'

const API_BASE = '/api/xueqiu'

const userId = ref('')
const contentType = ref(1)
const posts = ref([])
const userInfo = ref(null)
const loading = ref(false)
const loadingAll = ref(false)
const error = ref('')
const currentPage = ref(1)
const maxPage = ref(1)
const hasMore = ref(false)

// 页面加载时获取设置的目标用户帖子
onMounted(async () => {
  try {
    // 获取设置的目标用户ID
    const res = await axios.get('/api/settings/XUEQIU_TARGET_USER_ID')
    if (res.data.success && res.data.data?.value) {
      userId.value = res.data.data.value
      await handleSearch()
    }
  } catch (err) {
    console.log('自动加载失败:', err.message)
  }
})

async function checkHealth() {
  try {
    const res = await axios.get(`${API_BASE}/health`)
    if (res.data.success) {
      alert(`Cookie 已配置: ${res.data.cookieConfigured ? '✓' : '✗'}`)
    }
  } catch (err) {
    alert('检查失败: ' + err.message)
  }
}

async function handleSearch() {
  if (!userId.value.trim()) {
    error.value = '请输入用户ID'
    return
  }

  loading.value = true
  error.value = ''
  posts.value = []
  currentPage.value = 1

  try {
    // 从数据库获取已保存的帖子
    const savedRes = await axios.get(`${API_BASE}/saved/${userId.value}`)
    if (savedRes.data.success && savedRes.data.data?.length > 0) {
      posts.value = savedRes.data.data.map(post => ({
        id: post.id,
        text: post.text,
        created_at: post.created_at,
        user: {
          id: post.user_id,
          screen_name: post.user_screen_name,
          profile_image_url: ''
        },
        reposts_count: post.reposts_count,
        comments_count: post.comments_count,
        likes_count: post.likes_count,
        source: post.source
      }))
      userInfo.value = {
        id: post.user_id,
        screen_name: post.user_screen_name
      }
      maxPage.value = 1
      hasMore.value = false
    } else {
      // 如果数据库没有，从 API 获取
      const infoRes = await fetchUserInfo(userId.value)
      if (infoRes.success) {
        userInfo.value = infoRes.data
      }

      const timelineRes = await fetchUserTimeline(userId.value, 1, contentType.value)
      if (timelineRes.success) {
        posts.value = timelineRes.data.statuses || []
        maxPage.value = timelineRes.data.maxPage || 1
        hasMore.value = currentPage.value < maxPage.value
      } else {
        error.value = timelineRes.error || '获取失败'
      }
    }
  } catch (err) {
    error.value = err.message || '网络错误'
  } finally {
    loading.value = false
  }
}

// 加载更多功能暂时保留但不使用
async function loadMore() {
  // 不再使用分页加载，直接显示数据库所有数据
}

function openPost(post) {
  window.open(`https://xueqiu.com/s/${post.user?.id}/${post.id}`, '_blank')
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // 超过7天显示日期
  if (diff > 7 * 24 * 60 * 60 * 1000) {
    return `${date.getMonth() + 1}-${date.getDate()}`
  }

  // 大于24小时显示天数
  if (diff > 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }

  // 大于1小时显示小时
  if (diff > 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }

  // 大于1分钟显示分钟
  if (diff > 60 * 1000) {
    return `${Math.floor(diff / 60 * 1000)}分钟前`
  }

  return '刚刚'
}

/**
 * 处理雪球头像 URL
 * 雪球返回多个尺寸用逗号分隔，需要取第一个并添加域名
 */
function getAvatarUrl(url) {
  if (!url) return ''
  // 取第一个（原始尺寸）
  const firstUrl = url.split(',')[0]
  // 如果已经是完整 URL 直接返回
  if (firstUrl.startsWith('http')) return firstUrl
  // 添加雪球域名
  return 'https://xqimg.imedao.com/' + firstUrl
}

function parseText(text) {
  if (!text) return ''

  // 雪球返回的 text 已经是 HTML 格式，不需要再转义
  // 直接返回，让 v-html 渲染
  let html = text

  // 对未转义的 @用户名 添加链接
  html = html.replace(/(?<!<a[^>]*>)@([a-zA-Z0-9_]+)(?![^<]*<\/a>)/g, '<span class="link">@$1</span>')

  // 对未转义的 #话题 添加链接
  html = html.replace(/(?<!<a[^>]*>)#([^#]+)#(?![^<]*<\/a>)/g, '<span class="tag">#$1#</span>')

  // 对未转义的 $股票 添加链接
  html = html.replace(/(?<!<a[^>]*>)\$([A-Z][a-zA-Z0-9]+)(?![^<]*<\/a>)/g, '<span class="symbol">$$$1</span>')

  return html
}
</script>

<style scoped>
.xueqiu {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e8ed;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

h1 {
  margin: 0;
  font-size: 20px;
  color: #0f1419;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-link {
  text-decoration: none;
  font-size: 18px;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.2s;
}

.nav-link:hover {
  background: #e1e8ed;
}

.cookie-bar {
  padding: 12px 20px;
  background: #fff3cd;
  border-bottom: 1px solid #ffc107;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cookie-input {
  padding: 8px 12px;
  border: 1px solid #d4a017;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
}

.cookie-input:focus {
  border-color: #ffc107;
}

.cookie-tip {
  font-size: 11px;
  color: #856404;
}

.search-bar {
  padding: 16px 20px;
  background: #f7f9fa;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.user-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  border: 1px solid #cfd9de;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
}

.user-input:focus {
  border-color: #1d9bf0;
}

.type-select {
  padding: 10px 14px;
  border: 1px solid #cfd9de;
  border-radius: 20px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

.search-btn, .load-more-btn {
  padding: 10px 20px;
  background: #1d9bf0;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.search-btn:hover:not(:disabled), .load-more-btn:hover:not(:disabled) {
  background: #1a8cd8;
}

.check-cookie-btn {
  padding: 10px 14px;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.check-cookie-btn:hover {
  background: #138496;
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-info {
  padding: 16px 20px;
  background: #f7f9fa;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  gap: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}

.user-details h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #0f1419;
}

.user-details p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #536471;
}

.user-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #536471;
}

.content {
  padding: 0;
}

.loading, .error, .empty {
  padding: 40px 20px;
  text-align: center;
  color: #536471;
}

.error {
  color: #e0245e;
}

.post-list {
  border-top: 1px solid #e1e8ed;
}

.post-card {
  padding: 16px 20px;
  border-bottom: 1px solid #e1e8ed;
  cursor: pointer;
  transition: background 0.2s;
}

.post-card:hover {
  background: #f7f9fa;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.post-user-info {
  display: flex;
  flex-direction: column;
}

.post-username {
  font-weight: 600;
  color: #0f1419;
  font-size: 15px;
}

.post-time {
  font-size: 13px;
  color: #536471;
}

.retweet-badge {
  font-size: 13px;
  color: #536471;
  margin-bottom: 4px;
}

.post-text {
  font-size: 15px;
  line-height: 1.5;
  color: #0f1419;
  word-wrap: break-word;
}

.post-text :deep(.link) {
  color: #1d9bf0;
}

.post-text :deep(.tag) {
  color: #1d9bf0;
}

.post-text :deep(.symbol) {
  color: #00b075;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: 12px;
}

.image-wrapper img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  background: #f7f9fa;
}

.post-symbols {
  margin-top: 8px;
}

.symbol-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #e8f5e9;
  color: #00b075;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
}

.post-stats {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  font-size: 13px;
  color: #536471;
}
</style>
