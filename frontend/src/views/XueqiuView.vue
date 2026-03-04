<template>
  <div class="xueqiu">
    <header class="header">
      <h1>❄️ 雪球网发言</h1>
      <div class="header-actions">
        <router-link to="/" class="nav-link" title="首页">🏠</router-link>
        <router-link to="/xueqiu/settings" class="nav-link" title="用户管理">⚙️</router-link>
      </div>
    </header>

    <!-- 帖子列表 -->
    <div class="content">
      <div v-if="loading && posts.length === 0" class="status-tip">加载中...</div>
      <div v-else-if="error" class="status-tip error">{{ error }}</div>
      <div v-else-if="posts.length === 0 && !loading" class="status-tip">
        暂无帖子，请先在设置页面添加用户
      </div>

      <div class="post-list">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-card"
        >
          <div class="post-header">
            <img
              :src="post.avatar || ''"
              :alt="post.user_screen_name"
              class="post-avatar"
              @click="goToUser(post.user_id)"
            />
            <div class="post-user-info">
              <span class="post-username" @click="goToUser(post.user_id)">
                {{ post.user_screen_name }}
              </span>
              <span class="post-time">{{ formatTime(post.created_at) }}</span>
            </div>
          </div>

          <div class="post-text" v-html="parseText(post.text)"></div>
        </div>
      </div>

      <!-- 哨兵元素 -->
      <div ref="sentinel" class="sentinel"></div>

      <!-- 底部状态 -->
      <div v-if="loading && posts.length > 0" class="status-tip">加载中...</div>
      <div v-else-if="!hasMore && posts.length > 0" class="status-tip muted">没有更多了</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import DOMPurify from 'dompurify'

const API_BASE = '/api/xueqiu'
const router = useRouter()

const posts = ref([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const error = ref('')
const sentinel = ref(null)

let observer = null

onMounted(async () => {
  await loadPosts(1)
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

async function loadPosts(pageNum) {
  if (loading.value || !hasMore.value) return

  loading.value = true
  error.value = ''
  try {
    const res = await axios.get(`${API_BASE}/posts`, { params: { page: pageNum, limit: 20 } })
    if (res.data.success) {
      const { posts: newPosts, hasMore: more } = res.data.data
      posts.value = pageNum === 1 ? newPosts : [...posts.value, ...newPosts]
      hasMore.value = more
      page.value = pageNum
    } else {
      error.value = res.data.error || '加载失败'
    }
  } catch (err) {
    error.value = err.message || '网络错误'
  } finally {
    loading.value = false
  }
}

function setupObserver() {
  observer = new IntersectionObserver(
    async (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loading.value) {
        await loadPosts(page.value + 1)
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
}

function goToUser(userId) {
  router.push(`/xueqiu/user/${userId}`)
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff > 7 * 24 * 60 * 60 * 1000) {
    return `${date.getMonth() + 1}-${date.getDate()}`
  }
  if (diff > 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }
  if (diff > 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }
  if (diff > 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }
  return '刚刚'
}

function parseText(text) {
  if (!text) return ''
  let html = text
  html = html.replace(/(?<!<a[^>]*>)@([a-zA-Z0-9_]+)(?![^<]*<\/a>)/g, '<span class="link">@$1</span>')
  html = html.replace(/(?<!<a[^>]*>)#([^#]+)#(?![^<]*<\/a>)/g, '<span class="tag">#$1#</span>')
  html = html.replace(/(?<!<a[^>]*>)\$([A-Z][a-zA-Z0-9]+)(?![^<]*<\/a>)/g, '<span class="symbol">$$$1</span>')
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['a', 'b', 'strong', 'i', 'em', 'br', 'span', 'p'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
  })
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

.content {
  padding: 0;
}

.status-tip {
  padding: 40px 20px;
  text-align: center;
  color: #536471;
}

.status-tip.error {
  color: #e0245e;
}

.status-tip.muted {
  color: #aab8c2;
  padding: 20px;
  font-size: 14px;
}

.post-list {
  border-top: 1px solid #e1e8ed;
}

.post-card {
  padding: 16px 20px;
  border-bottom: 1px solid #e1e8ed;
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
  cursor: pointer;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.post-avatar:hover {
  opacity: 0.8;
}

.post-user-info {
  display: flex;
  flex-direction: column;
}

.post-username {
  font-weight: 600;
  color: #0f1419;
  font-size: 15px;
  cursor: pointer;
}

.post-username:hover {
  text-decoration: underline;
}

.post-time {
  font-size: 13px;
  color: #536471;
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

.sentinel {
  height: 1px;
}
</style>
