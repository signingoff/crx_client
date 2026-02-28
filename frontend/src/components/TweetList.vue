<template>
  <div class="tweet-list">
    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="tweets.length === 0" class="empty">
      暂无推文
    </div>

    <div v-else class="tweets">
      <TweetCard
        v-for="tweet in localTweets"
        :key="tweet.id"
        :tweet="tweet"
        :is-selected="tweet.id === selectedId"
        @select-tweet="$emit('select-tweet', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import TweetCard from './TweetCard.vue'
import { fetchReadStatus } from '../api/tweets.js'

const props = defineProps({
  tweets: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  selectedId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select-tweet', 'update:tweets'])

// 本地推文列表（用于更新已读状态）
const localTweets = ref([...props.tweets])

// 同步定时器
let syncInterval = null

// 同步已读状态
async function syncReadStatus() {
  if (localTweets.value.length === 0) return

  try {
    // 获取当前显示的所有推文ID
    const tweetIds = localTweets.value.map(t => t.id)

    // 查询已读状态
    const response = await fetchReadStatus(tweetIds)

    if (response.success && response.data) {
      const readStatusMap = response.data

      // 更新本地推文列表的已读状态
      let hasUpdate = false
      const updatedTweets = localTweets.value.map(tweet => {
        const serverIsRead = readStatusMap[tweet.id]
        // 如果服务器标记为已读，但本地未读，则更新
        if (serverIsRead && !tweet.isRead) {
          hasUpdate = true
          return { ...tweet, isRead: true }
        }
        return tweet
      })

      // 只有有更新时才赋值（避免不必要的重新渲染）
      if (hasUpdate) {
        localTweets.value = updatedTweets
        // 通知父组件更新（可选）
        emit('update:tweets', updatedTweets)
      }
    }
  } catch (err) {
    console.error('同步已读状态失败:', err)
  }
}

// 监听 props.tweets 变化
watch(() => props.tweets, (newTweets) => {
  localTweets.value = [...newTweets]
  // 立即同步一次已读状态
  syncReadStatus()
}, { deep: true, immediate: true })

// 组件挂载时启动定时同步
onMounted(() => {
  // 每5秒同步一次已读状态
  syncInterval = setInterval(syncReadStatus, 5000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
})
</script>

<style scoped>
.tweet-list {
  width: 100%;
  padding: 16px;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 40px;
  color: #536471;
}

.error {
  color: #f4212e;
}

.tweets {
  display: flex;
  flex-direction: column;
}
</style>
