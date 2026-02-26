<template>
  <div
    class="tweet-card"
    :class="{ 'is-selected': isSelected }"
    @click="selectTweet"
  >
    <!-- 转发标识 -->
    <div v-if="isRetweet" class="retweet-header">
      <span>🔄 {{ tweet.author.name }} 转发了</span>
    </div>

    <div class="tweet-header">
      <img :src="displayAuthor.avatar" :alt="displayAuthor.name" class="avatar" />
      <div class="author-info">
        <span class="author-name">{{ displayAuthor.name }}</span>
        <span class="author-username">@{{ displayAuthor.username }}</span>
        <span class="tweet-time">{{ formatTime(tweet.createdAt) }}</span>
      </div>
    </div>

    <div class="tweet-content">
      <p v-html="formatText(displayText)"></p>
      <button
        v-if="tweet.isLongText"
        class="show-more-btn"
        @click="toggleExpanded"
      >
        {{ isExpanded ? 'Show less' : 'Show more' }}
      </button>
    </div>

    <!-- 媒体内容 -->
    <div v-if="tweet.media.length" class="tweet-media" :class="{ 'single': tweet.media.length === 1, 'multiple': tweet.media.length > 1 }">
      <div
        v-for="(media, index) in tweet.media"
        :key="index"
        class="media-item"
        :class="{ 'video-item': media.type === 'video' || media.type === 'animated_gif' }"
        @click="media.type === 'photo' && openLightbox(media)"
      >
        <!-- 静态图片 -->
        <img v-if="media.type === 'photo'" :src="media.url" alt="Tweet media" loading="lazy" />

        <!-- GIF 动画 -->
        <a
          v-else-if="media.type === 'animated_gif'"
          :href="getOriginalTweetUrl()"
          target="_blank"
          rel="noopener"
          class="gif-container"
        >
          <img :src="media.url" alt="GIF" class="media-thumb" loading="lazy" />
          <span class="gif-badge">GIF</span>
          <span class="play-icon">▶</span>
        </a>

        <!-- 视频 -->
        <a
          v-else-if="media.type === 'video'"
          :href="getOriginalTweetUrl()"
          target="_blank"
          rel="noopener"
          class="video-container"
        >
          <img :src="media.url" alt="Video" class="media-thumb" loading="lazy" />
          <span class="video-badge">▶</span>
        </a>
      </div>
    </div>

    <!-- 图片放大查看器 -->
    <Teleport to="body">
      <div v-if="lightboxOpen" class="lightbox-overlay" @click="closeLightbox">
        <div class="lightbox-content" @click.stop>
          <img :src="lightboxImage?.url" alt="Full size" class="lightbox-image" />
          <button class="close-btn" @click="closeLightbox">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Teleport>

    <div class="tweet-metrics">
      <span class="metric" title="Replies">💬 {{ formatNumber(tweet.metrics.replies) }}</span>
      <span class="metric" title="Retweets">🔄 {{ formatNumber(tweet.metrics.retweets) }}</span>
      <span class="metric" title="Likes">❤️ {{ formatNumber(tweet.metrics.likes) }}</span>
      <span v-if="tweet.metrics.views" class="metric" title="Views">👁️ {{ formatNumber(tweet.metrics.views) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tweet: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['block-user', 'select-tweet'])

const lightboxOpen = ref(false)
const lightboxImage = ref(null)
const isExpanded = ref(false)

// 判断是否为转发
const isRetweet = computed(() => {
  return props.tweet.text?.startsWith('RT @')
})

// 解析转发内容
const parsedRetweet = computed(() => {
  if (!isRetweet.value) return null

  const text = props.tweet.text
  const match = text.match(/^RT @([^:]+): (.+)$/s)
  if (match) {
    return {
      originalUsername: match[1],
      originalText: match[2]
    }
  }
  return null
})

// 显示的作者（转发时显示原推文作者）
const displayAuthor = computed(() => {
  if (isRetweet.value && parsedRetweet.value) {
    // 尝试从 user_mentions 中找到原推文作者信息
    const mention = props.tweet.entities?.user_mentions?.find(
      m => m.screen_name === parsedRetweet.value.originalUsername
    )
    if (mention) {
      return {
        name: mention.name,
        username: mention.screen_name,
        avatar: props.tweet.author.avatar // 转发时暂时使用转发者头像
      }
    }
    return {
      name: parsedRetweet.value.originalUsername,
      username: parsedRetweet.value.originalUsername,
      avatar: props.tweet.author.avatar
    }
  }
  return props.tweet.author
})

// 显示的文本
const displayText = computed(() => {
  let text = props.tweet.text || ''

  // 如果是转发，尝试解析原推文内容
  if (isRetweet.value && parsedRetweet.value) {
    text = parsedRetweet.value.originalText
  }

  // 长推文未展开时截断显示
  if (props.tweet.isLongText && !isExpanded.value) {
    return text.slice(0, 280) + '...'
  }
  return text
})

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function selectTweet() {
  emit('select-tweet', props.tweet.id)
}

function openLightbox(media) {
  lightboxImage.value = media
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  lightboxOpen.value = false
  lightboxImage.value = null
  document.body.style.overflow = ''
}

function getOriginalTweetUrl() {
  // 跳转到原推文
  return `https://x.com/i/web/status/${props.tweet.id}`
}

function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN')
}

function formatNumber(num) {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function formatText(text) {
  if (!text) return ''
  // 高亮话题标签
  return text
    .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
    .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.tweet-card {
  background: #fff;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
  position: relative;
}

.tweet-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.tweet-card.is-selected {
  border-color: #1d9bf0;
  background: rgba(29, 155, 240, 0.05);
  box-shadow: 0 0 0 2px rgba(29, 155, 240, 0.3);
}

/* 转发头部 */
.retweet-header {
  font-size: 13px;
  color: #536471;
  margin-bottom: 8px;
  padding-left: 56px;
}

.tweet-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 700;
  font-size: 15px;
  color: #0f1419;
}

.author-username {
  font-size: 14px;
  color: #536471;
}

.tweet-time {
  font-size: 13px;
  color: #536471;
  margin-top: 2px;
}

.tweet-content {
  margin-bottom: 12px;
  font-size: 15px;
  line-height: 1.5;
  color: #0f1419;
}

.tweet-content :deep(.hashtag) {
  color: #1d9bf0;
}

.tweet-content :deep(.mention) {
  color: #1d9bf0;
}

.show-more-btn {
  background: none;
  border: none;
  color: #1d9bf0;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 4px;
  transition: opacity 0.2s;
}

.show-more-btn:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.tweet-media {
  display: grid;
  gap: 4px;
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
}

/* 单张图片 */
.tweet-media.single {
  grid-template-columns: 1fr;
}

/* 多张图片网格布局 */
.tweet-media.multiple {
  grid-template-columns: repeat(2, 1fr);
}

.tweet-media.multiple:has(.media-item:nth-child(3):last-child) {
  grid-template-columns: repeat(2, 1fr);
}

.tweet-media.multiple:has(.media-item:nth-child(3)) {
  grid-template-columns: repeat(2, 1fr);
}

/* 3张图片特殊布局 */
.tweet-media.multiple:has(.media-item:nth-child(3)):not(:has(.media-item:nth-child(4))) .media-item:first-child {
  grid-column: span 2;
}

.media-item {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  aspect-ratio: 1;
  background: #f7f9fa;
}

.media-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.media-item:hover img {
  transform: scale(1.02);
}

/* 媒体缩略图 */
.media-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* GIF 容器 */
.gif-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
  text-decoration: none;
}

.gif-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

/* 视频容器 */
.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
  text-decoration: none;
}

.video-badge,
.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(29, 155, 240, 0.9);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  padding-left: 4px;
}

.video-badge {
  font-size: 16px;
}

/* 图片放大查看器 */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: zoom-out;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  cursor: default;
}

.lightbox-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.close-btn svg {
  width: 24px;
  height: 24px;
}

.tweet-metrics {
  display: flex;
  gap: 24px;
  color: #536471;
  font-size: 13px;
}

.metric {
  cursor: pointer;
  transition: color 0.2s;
}

.metric:hover {
  color: #1d9bf0;
}
</style>
