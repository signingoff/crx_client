<template>
  <div class="home">
    <header class="header">
      <h1>🔥 X For You</h1>
      <div class="header-actions">
        <router-link to="/xueqiu" class="nav-link" title="雪球发言">
          ❄️
        </router-link>
<button class="settings-btn" @click="openSettings" title="设置">
          🔧
        </button>
        <span v-if="loading && tweets.length === 0" class="loading-indicator">⟳ 加载中...</span>
        <span v-else-if="lastUpdated" class="last-updated">{{ lastUpdated }}</span>
      </div>
    </header>

    <!-- 新推文提示条 -->
    <div v-if="pendingTweets.length > 0" class="pending-bar">
      <button class="load-btn" @click="loadPendingTweets">
        Load {{ pendingTweets.length }} post{{ pendingTweets.length > 1 ? 's' : '' }}
      </button>
    </div>

    <div class="content">
      <TweetList
        :tweets="tweets"
        :loading="loading && tweets.length === 0"
        :error="error"
        @select-tweet="openTweet"
      />
    </div>

    <!-- 设置面板 -->
    <QueryIdSettings
      v-if="showSettings"
      @close="closeSettings"
      @updated="handleConfigUpdated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import TweetList from '../components/TweetList.vue'
import QueryIdSettings from '../components/QueryIdSettings.vue'

const tweets = ref([])
const pendingTweets = ref([])
const loading = ref(false)
const error = ref('')
const lastUpdated = ref('')
const showSettings = ref(false)
let refreshInterval = null

function normalizeTwitterPost(post) {
  return {
    id: post.id,
    text: post.text,
    createdAt: new Date(post.created_at).toISOString(),
    source: 'twitter',
    is_read: post.is_read || false,
    author: {
      name: post.user_name,
      username: post.user_screen_name,
      avatar: post.avatar_url,
    },
    metrics: {
      replies: post.replies_count || 0,
      retweets: post.retweets_count || 0,
      likes: post.likes_count || 0,
    },
    media: post.media || [],
    entities: post.entities || null,
    article: post.article || null,
  }
}

function normalizeXueqiuPost(post) {
  return {
    id: String(post.id),
    text: post.text,
    createdAt: post.created_at ? new Date(Number(post.created_at)).toISOString() : null,
    source: 'xueqiu',
    is_read: post.is_read || false,
    userId: post.user_id,
    author: {
      name: post.user_screen_name,
      username: post.user_screen_name,
      avatar: post.avatar || '',
    },
    metrics: {
      replies: post.comments_count || 0,
      retweets: post.reposts_count || 0,
      likes: post.likes_count || 0,
    },
    media: [],
    entities: null,
    article: null,
  }
}

function openSettings() {
  showSettings.value = true
}

function closeSettings() {
  showSettings.value = false
}

function handleConfigUpdated() {
  // Query ID 更新后刷新推文
  loadTweets()
}

async function loadTweets() {
  // 如果是初始加载，显示loading
  if (tweets.value.length === 0) {
    loading.value = true
  }
  error.value = ''

  try {
    const [twitterRes, xueqiuRes] = await Promise.all([
      axios.get('/api/twitter/posts', { params: { page: 1, limit: 30 } }).catch(() => null),
      axios.get('/api/xueqiu/posts', { params: { page: 1, limit: 30 } }).catch(() => null)
    ])

    const twitterPosts = (twitterRes?.data?.data?.posts || []).map(normalizeTwitterPost)
    const xueqiuPosts = (xueqiuRes?.data?.data?.posts || []).map(normalizeXueqiuPost)
    const allNew = [...twitterPosts, ...xueqiuPosts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const existingIds = new Set(tweets.value.map(t => t.id))
    const newItems = allNew.filter(t => !existingIds.has(t.id))

    if (tweets.value.length === 0) {
      tweets.value = allNew
      updateLastUpdatedTime()
    } else if (newItems.length > 0) {
      const pendingIds = new Set(pendingTweets.value.map(t => t.id))
      const trulyNew = newItems.filter(t => !pendingIds.has(t.id))
      if (trulyNew.length > 0) {
        pendingTweets.value = [...trulyNew, ...pendingTweets.value]
      }
    }
  } catch (err) {
    error.value = err.message || '网络错误，请检查后端服务'
  } finally {
    loading.value = false
  }
}

async function loadPendingTweets() {
  // 将待加载推文添加到列表顶部
  const loadedTweets = [...pendingTweets.value]
  tweets.value = [...loadedTweets, ...tweets.value]
  pendingTweets.value = []
  updateLastUpdatedTime()
  // 滚动到顶部（浏览器窗口）
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openTweet(tweetId) {
  window.open(`https://x.com/i/web/status/${tweetId}`, '_blank')
}

function updateLastUpdatedTime() {
  const now = new Date()
  lastUpdated.value = `更新于 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
}

onMounted(() => {
  loadTweets()
  refreshInterval = setInterval(loadTweets, 8000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
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

.loading-indicator {
  font-size: 13px;
  color: #1d9bf0;
  animation: pulse 1.5s infinite;
}

.last-updated {
  font-size: 12px;
  color: #536471;
}

.pending-bar {
  padding: 12px 20px;
  background: #f7f9fa;
  border-bottom: 1px solid #e1e8ed;
  text-align: center;
}

.load-btn {
  background: #1d9bf0;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.load-btn:hover {
  background: #1a8cd8;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-link:hover {
  background: #e1e8ed;
}

.settings-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.2s;
}

.settings-btn:hover {
  background: #e1e8ed;
}
</style>
