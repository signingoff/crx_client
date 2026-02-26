<template>
  <div class="home">
    <div class="left-panel">
      <header class="header">
        <h1>🔥 X For You</h1>
        <span v-if="loading" class="loading-indicator">⟳ 更新中...</span>
        <span v-else-if="lastUpdated" class="last-updated">{{ lastUpdated }}</span>
      </header>

      <TweetList
        :tweets="tweets"
        :loading="loading && tweets.length === 0"
        :error="error"
        :selected-id="selectedTweetId"
        @block-user="handleBlockUser"
        @select-tweet="selectTweet"
      />
    </div>

    <div class="right-panel">
      <!-- 浏览器环境：扩展未安装时显示引导 -->
      <ExtensionGuide
        v-if="!isElectron && !extensionInstalled"
        @installed="onExtensionInstalled"
        @skip="onSkipExtension"
      />

      <!-- 内容显示区域 -->
      <template v-else>
        <div v-if="!selectedTweetUrl" class="empty-state">
          <p>点击左侧推文查看详情</p>
        </div>

        <!-- Electron 环境：使用 webview -->
        <webview
          v-else-if="isElectron"
          ref="tweetWebview"
          :src="selectedTweetUrl"
          class="x-webview"
          :preload="webviewPreloadPath"
          @dom-ready="onWebviewReady"
        ></webview>

        <!-- 浏览器环境：使用 iframe -->
        <iframe
          v-else
          ref="tweetIframe"
          :src="selectedTweetUrl"
          class="x-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerpolicy="no-referrer"
          @load="onIframeLoad"
        ></iframe>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import TweetList from '../components/TweetList.vue'
import ExtensionGuide from '../components/ExtensionGuide.vue'
import { fetchForYouTweets } from '../api/tweets.js'
import { checkExtensionInstalled, waitForExtension } from '../utils/extension.js'

const tweets = ref([])
const loading = ref(false)
const error = ref('')
const lastUpdated = ref('')
const selectedTweetId = ref(null)
const extensionInstalled = ref(false)
const extensionSkipped = ref(false)
const tweetIframe = ref(null)
const tweetWebview = ref(null)
let refreshInterval = null

// 检测是否在 Electron 环境
const isElectron = computed(() => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true
})

// webview preload 脚本路径（Electron 环境）
const webviewPreloadPath = computed(() => {
  if (isElectron.value && window.electronPaths?.webviewPreload) {
    return window.electronPaths.webviewPreload
  }
  return ''
})

const selectedTweetUrl = computed(() => {
  if (!selectedTweetId.value) return null
  return `https://x.com/i/web/status/${selectedTweetId.value}`
})

async function loadTweets() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetchForYouTweets(20)
    if (response.success) {
      const existingIds = new Set(tweets.value.map(t => t.id))
      const newTweets = response.data.filter(t => !existingIds.has(t.id))

      if (newTweets.length > 0) {
        tweets.value = [...newTweets, ...tweets.value]
      } else if (tweets.value.length === 0) {
        tweets.value = response.data
      }

      updateLastUpdatedTime()
    } else {
      error.value = response.error || '获取失败'
    }
  } catch (err) {
    error.value = err.message || '网络错误，请检查后端服务'
  } finally {
    loading.value = false
  }
}

function handleBlockUser(username) {
  tweets.value = tweets.value.filter(t => t.author.username !== username)
}

function selectTweet(tweetId) {
  selectedTweetId.value = tweetId
}

function updateLastUpdatedTime() {
  const now = new Date()
  lastUpdated.value = `更新于 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
}

onMounted(() => {
  loadTweets()
  refreshInterval = setInterval(loadTweets, 15000)

  // Electron 环境下跳过扩展检测
  if (isElectron.value) {
    extensionInstalled.value = true
  } else {
    checkExtension()
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

async function checkExtension() {
  const result = await checkExtensionInstalled()
  extensionInstalled.value = result.installed || extensionSkipped.value
}

function onExtensionInstalled() {
  extensionInstalled.value = true
}

function onSkipExtension() {
  extensionSkipped.value = true
  extensionInstalled.value = true
}

function onIframeLoad() {
  // iframe 加载完成后的处理
  console.log('Iframe loaded:', selectedTweetUrl.value)
}

function onWebviewReady() {
  // webview 加载完成后的处理
  console.log('Webview ready:', selectedTweetUrl.value)
}
</script>

<style scoped>
.home {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.left-panel {
  width: 400px;
  min-width: 400px;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid #e1e8ed;
  background: #fff;
}

.right-panel {
  flex: 1;
  height: 100vh;
  position: relative;
  background: #f7f9fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e8ed;
  position: sticky;
  top: 0;
  background: #fff;
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

.x-iframe,
.x-webview {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  border: none;
  display: block;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #536471;
  font-size: 16px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 自定义滚动条 */
.left-panel::-webkit-scrollbar {
  width: 6px;
}

.left-panel::-webkit-scrollbar-track {
  background: transparent;
}

.left-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.left-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
