<template>
  <div
    class="tweet-card"
    :class="{ 'is-selected': isSelected, 'is-read': isRead }"
    @click="handleTripleClick"
    title="连续单击3次切换已读/未读"
  >
    <!-- 已读标记 -->
    <div v-if="isRead" class="read-indicator">✓ 已读</div>

    <!-- X 图标按钮 - 点击打开 X.com -->
    <button class="x-link-btn" @click="openTweetLink" title="在 X.com 打开">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    </button>

    <!-- 转发标识 -->
    <div v-if="isRetweet" class="retweet-header">
      <span>🔄 {{ tweet.author.name }} 转发了</span>
    </div>

    <div class="tweet-header">
      <img :src="displayAuthor.avatar" :alt="displayAuthor.name" class="avatar" />
      <div class="author-info">
        <div class="author-main">
          <span class="author-name">{{ displayAuthor.name }}</span>
          <span class="author-username">@{{ displayAuthor.username }}</span>
          <span class="tweet-time">&nbsp;{{ formatTime(tweet.createdAt) }}</span>
        </div>
        <!-- 用户详细信息 -->
        <div v-if="displayAuthor.description" class="author-description">
          {{ displayAuthor.description }}
        </div>
        <div v-if="displayAuthor.location" class="author-meta">
          <span class="meta-item">📍 {{ displayAuthor.location }}</span>
        </div>
        <div class="author-stats">
          <span v-if="displayAuthor.followingCount !== undefined" class="stat-item">
            <strong>{{ formatNumber(displayAuthor.followingCount) }}</strong> Following
          </span>
          <span v-if="displayAuthor.followersCount !== undefined" class="stat-item">
            <strong>{{ formatNumber(displayAuthor.followersCount) }}</strong> Followers
          </span>
          <span v-if="displayAuthor.createdAt" class="stat-item">
            Joined {{ formatJoinDate(displayAuthor.createdAt) }}
          </span>
        </div>
      </div>
    </div>

    <div class="tweet-content">
      <p v-html="formatText(displayText)"></p>
      <button
        v-if="tweet.isLongText"
        class="show-more-btn"
        @click.stop="toggleExpanded"
      >
        {{ isExpanded ? 'Show less' : 'Show more' }}
      </button>
    </div>

    <!-- 媒体内容：只显示图片，不显示视频/GIF -->
    <div v-if="photoMedia.length" class="tweet-media" :class="{ 'single': photoMedia.length === 1, 'multiple': photoMedia.length > 1 }">
      <div
        v-for="(media, index) in photoMedia"
        :key="index"
        class="media-item"
        @click.stop="openLightbox(media)"
      >
        <img :src="getThumbnailUrl(media.url)" :data-full="media.url" alt="Tweet media" loading="lazy" />
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
import { markTweetAsRead, markTweetAsUnread } from '../api/tweets.js'

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

const emit = defineEmits(['select-tweet'])

const lightboxOpen = ref(false)
const lightboxImage = ref(null)
const isExpanded = ref(false)
const isRead = ref(false)

// 三连击检测
const clickCount = ref(0)
let clickTimer = null
const TRIPLE_CLICK_DELAY = 500 // 500ms 内连续点击3次视为三连击

// 只获取图片类型的媒体
const photoMedia = computed(() => {
  return props.tweet.media?.filter(m => m.type === 'photo') || []
})

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
  // 调试输出
  console.log('tweet.author:', props.tweet.author)
  // 非转发推文，直接返回原始 author
  if (!isRetweet.value) {
    return props.tweet.author
  }
  // 转发推文，尝试获取原推文作者信息
  if (parsedRetweet.value) {
    // 尝试从 user_mentions 中找到原推文作者信息
    const mention = props.tweet.entities?.user_mentions?.find(
      m => m.screen_name === parsedRetweet.value.originalUsername
    )
    if (mention) {
      return {
        name: mention.name,
        username: mention.screen_name,
        avatar: props.tweet.author.avatar, // 转发时暂时使用转发者头像
        // 转发推文中可能没有原推文的详细 info，使用转发者的
        description: props.tweet.author.description,
        location: props.tweet.author.location,
        createdAt: props.tweet.author.createdAt,
        followingCount: props.tweet.author.followingCount,
        followersCount: props.tweet.author.followersCount
      }
    }
    return {
      name: parsedRetweet.value.originalUsername,
      username: parsedRetweet.value.originalUsername,
      avatar: props.tweet.author.avatar,
      description: props.tweet.author.description,
      location: props.tweet.author.location,
      createdAt: props.tweet.author.createdAt,
      followingCount: props.tweet.author.followingCount,
      followersCount: props.tweet.author.followersCount
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

function openTweetLink() {
  window.open(`https://x.com/i/web/status/${props.tweet.id}`, '_blank')
}

// 三连击切换已读/未读状态
async function handleTripleClick() {
  clickCount.value++

  // 第一次点击时启动定时器
  if (!clickTimer) {
    clickTimer = setTimeout(() => {
      // 超时重置计数
      clickCount.value = 0
      clickTimer = null
    }, TRIPLE_CLICK_DELAY)
  }

  // 达到3次点击，执行切换
  if (clickCount.value >= 3) {
    // 清除定时器
    clearTimeout(clickTimer)
    clickTimer = null
    clickCount.value = 0

    // 切换状态
    const newReadState = !isRead.value
    isRead.value = newReadState

    try {
      if (newReadState) {
        await markTweetAsRead(props.tweet.id)
      } else {
        await markTweetAsUnread(props.tweet.id)
      }
    } catch (err) {
      console.error('标记已读/未读失败:', err)
      // 如果失败，回滚状态
      isRead.value = !newReadState
    }
  }
}

// 获取缩略图 URL
function getThumbnailUrl(url) {
  if (!url) return ''
  // X/Twitter 图片支持通过 name 参数获取不同尺寸
  // name=thumb/small/medium/large
  if (url.includes('pbs.twimg.com')) {
    // 如果 URL 已经有查询参数，添加 &name=small
    if (url.includes('?')) {
      return url + '&name=small'
    }
    // 否则添加 ?name=small
    return url + '?name=small'
  }
  return url
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

function formatJoinDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatText(text) {
  if (!text) return ''
  // 高亮话题标签和@用户名，@用户名添加链接
  return text
    .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
    .replace(/@(\w+)/g, '<a href="https://x.com/$1" target="_blank" class="mention-link" onclick="event.stopPropagation()">@$1</a>')
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
}

/* 已读状态 */
.tweet-card.is-read {
  /* 不修改背景颜色，只显示已读标记 */
}

.read-indicator {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #00ba7c;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  z-index: 2;
}

.tweet-card.is-selected {
  border-color: #1d9bf0;
  background: rgba(29, 155, 240, 0.05);
  box-shadow: 0 0 0 2px rgba(29, 155, 240, 0.3);
}

/* X 链接按钮 */
.x-link-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  padding: 6px;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
  z-index: 2;
}

.x-link-btn:hover {
  background: rgba(29, 155, 240, 0.1);
}

.x-link-btn svg {
  width: 18px;
  height: 18px;
  fill: #536471;
  transition: fill 0.2s;
}

.x-link-btn:hover svg {
  fill: #1d9bf0;
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

/* 用户详细信息 */
.author-description {
  font-size: 13px;
  color: #536471;
  margin-top: 4px;
  line-height: 1.4;
  max-width: 500px;
}

.author-meta {
  margin-top: 4px;
  font-size: 13px;
  color: #536471;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.author-stats {
  display: flex;
  gap: 16px;
  margin-top: 6px;
  font-size: 13px;
  color: #536471;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.stat-item strong {
  color: #0f1419;
  font-weight: 600;
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

.tweet-content :deep(.mention-link) {
  color: #1d9bf0;
  text-decoration: none;
}

.tweet-content :deep(.mention-link:hover) {
  text-decoration: underline;
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

/* 单张图片 - 保持原始比例，限制最大高度 */
.tweet-media.single {
  grid-template-columns: 1fr;
}

.tweet-media.single .media-item {
  aspect-ratio: auto;
  max-height: 500px;
}

.tweet-media.single .media-item img {
  object-fit: contain;
  object-position: center;
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
