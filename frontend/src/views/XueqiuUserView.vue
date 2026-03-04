<template>
  <div class="xueqiu-user">
    <header class="header">
      <button class="back-btn" @click="router.push('/xueqiu')" title="返回">🔙</button>
      <div v-if="userInfo" class="header-user">
        <img :src="userInfo.avatar" :alt="userInfo.name" class="header-avatar" />
        <span class="header-name">{{ userInfo.name }}</span>
      </div>
      <div v-else class="header-title">用户详情</div>
    </header>

    <!-- 帖子列表 -->
    <div class="content">
      <div v-if="loading && posts.length === 0" class="status-tip">加载中...</div>
      <div v-else-if="error" class="status-tip error">{{ error }}</div>
      <div v-else-if="posts.length === 0 && !loading" class="status-tip">暂无帖子</div>

      <div class="post-list">
        <div
          v-for="post in displayedPosts"
          :key="post.id"
          class="post-card"
        >
          <div class="post-header">
            <img
              :src="post.avatar || ''"
              :alt="post.user_screen_name"
              class="post-avatar"
            />
            <div class="post-user-info">
              <span class="post-username">{{ post.user_screen_name }}</span>
              <span class="post-time">{{ formatTime(post.created_at) }}</span>
            </div>
          </div>

          <div class="post-text" v-html="parseText(post.text)"></div>
        </div>
      </div>

      <!-- 哨兵元素 -->
      <div ref="sentinel" class="sentinel"></div>

      <!-- 底部状态 -->
      <div v-if="!hasMore && posts.length > 0" class="status-tip muted">没有更多了</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import DOMPurify from 'dompurify'

const API_BASE = '/api/xueqiu'
const route = useRoute()
const router = useRouter()

const userId = route.params.userId

const posts = ref([])
const page = ref(1)
const PAGE_SIZE = 30
const loading = ref(false)
const error = ref('')
const sentinel = ref(null)

let observer = null

const hasMore = computed(() => page.value * PAGE_SIZE < posts.value.length || loading.value)

const displayedPosts = computed(() => posts.value.slice(0, page.value * PAGE_SIZE))

const userInfo = computed(() => {
  if (!posts.value.length) return null
  const first = posts.value[0]
  return { name: first.user_screen_name, avatar: first.avatar || '' }
})

onMounted(async () => {
  await loadPosts()
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

async function loadPosts() {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.get(`${API_BASE}/saved/${userId}`)
    if (res.data.success) {
      posts.value = res.data.data || []
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
    (entries) => {
      if (entries[0].isIntersecting && page.value * PAGE_SIZE < posts.value.length) {
        page.value++
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
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
.xueqiu-user {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e8ed;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  background: none;
  border: none;
  font-size: 18px;
  padding: 6px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #e1e8ed;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.header-name {
  font-size: 18px;
  font-weight: 700;
  color: #0f1419;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f1419;
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
  flex-shrink: 0;
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
