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
        v-for="tweet in tweets"
        :key="tweet.id"
        :tweet="tweet"
        :is-selected="tweet.id === selectedId"
        @select-tweet="$emit('select-tweet', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import TweetCard from './TweetCard.vue'

defineProps({
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

defineEmits(['select-tweet'])
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
