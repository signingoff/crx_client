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
        :is-read="tweet.isRead"
        @select-tweet="$emit('select-tweet', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import TweetCard from './TweetCard.vue'

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

const emit = defineEmits(['select-tweet'])

// 本地推文列表（用于响应 props.tweets 变化）
const localTweets = ref([...props.tweets])

// 监听 props.tweets 变化
watch(() => props.tweets, (newTweets) => {
  localTweets.value = [...newTweets]
}, { deep: true, immediate: true })
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
