<template>
  <div class="home">
    <header class="header">
      <h1>🔥 X For You</h1>
      <div class="header-actions">
        <router-link to="/embed" class="nav-link" title="嵌入推文">
          🔗
        </router-link>
        <button class="settings-btn" @click="openSettings" title="设置">
          ⚙️
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
import TweetList from '../components/TweetList.vue'
import QueryIdSettings from '../components/QueryIdSettings.vue'
import { fetchForYouTweets } from '../api/tweets.js'

const tweets = ref([])
const pendingTweets = ref([])
const loading = ref(false)
const error = ref('')
const lastUpdated = ref('')
const showSettings = ref(false)
let refreshInterval = null

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
    const response = await fetchForYouTweets(20)
    console.log('API response:', response)
    if (response.success) {
      const existingIds = new Set(tweets.value.map(t => t.id))
      const newTweets = response.data.filter(t => !existingIds.has(t.id))

      if (tweets.value.length === 0) {
        // 初始加载，直接显示
        tweets.value = response.data
        updateLastUpdatedTime()
      } else if (newTweets.length > 0) {
        // 有新推文，加入待加载列表
        const pendingIds = new Set(pendingTweets.value.map(t => t.id))
        const trulyNew = newTweets.filter(t => !pendingIds.has(t.id))
        if (trulyNew.length > 0) {
          pendingTweets.value = [...trulyNew, ...pendingTweets.value]
        }
      }
    } else {
      error.value = response.error || '获取失败'
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
  refreshInterval = setInterval(loadTweets, 15000)
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
