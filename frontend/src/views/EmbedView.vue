<template>
  <div class="embed-view">
    <header class="header">
      <h1>🔥 X For You - 嵌入视图</h1>
      <div class="header-actions">
        <router-link to="/" class="nav-link" title="返回标准视图">
          🏠
        </router-link>
      </div>
    </header>

    <!-- 主题切换 -->
    <div class="toolbar">
      <div class="options">
        <label>主题：</label>
        <label><input v-model="options.theme" type="radio" value="light" /> 浅色</label>
        <label><input v-model="options.theme" type="radio" value="dark" /> 深色</label>
      </div>
      <span v-if="loading" class="loading">⟳ 加载中...</span>
    </div>

    <!-- 所有推文列表 - 使用 Twitter 嵌入 -->
    <main class="main-content">
      <div v-if="error" class="error">{{ error }}</div>

      <div class="tweets-list">
        <div v-for="tweet in tweets" :key="tweet.id" class="tweet-wrapper">
          <div class="tweet-meta">
            <span class="author">@{{ tweet.author.username }}</span>
            <span class="time">{{ formatTime(tweet.createdAt) }}</span>
          </div>
          <TwitterEmbed :tweet-id="tweet.id" :options="options" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import axios from 'axios'
import TwitterEmbed from '../components/TwitterEmbed.vue'

const tweets = ref([])
const loading = ref(false)
const error = ref('')

const options = reactive({
  theme: 'light',
  cards: 'visible',
  conversation: 'none',
  align: 'center'
})

async function loadTweets() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get('/api/twitter/posts', { params: { page: 1, limit: 20 } })
    if (response.data.success) {
      tweets.value = response.data.data.posts.map(p => ({
        id: p.id,
        createdAt: new Date(p.created_at).toISOString(),
        author: { username: p.user_screen_name }
      }))
    }
  } catch (err) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadTweets()
})
</script>

<style scoped>
.embed-view {
  min-height: 100vh;
  background: #f7f9fa;
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid #e1e8ed;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 20px;
  font-weight: 700;
  color: #0f1419;
  margin: 0;
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

.toolbar {
  background: #fff;
  padding: 12px 20px;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.options {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 14px;
  color: #536471;
}

.options label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.loading {
  color: #1d9bf0;
  font-size: 14px;
}

.main-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.error {
  background: #ffe5e5;
  color: #f4212e;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.tweets-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tweet-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tweet-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
}

.tweet-meta .author {
  font-weight: 600;
  color: #0f1419;
}

.tweet-meta .time {
  color: #536471;
}
</style>
