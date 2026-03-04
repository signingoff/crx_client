<template>
  <div
    class="tweet-card"
    :class="{ 'is-selected': isSelected, 'is-read': actualIsRead }"
    @click="handleTripleClick"
    title="连续单击3次切换已读/未读"
  >
    <!-- 已读标记 -->
    <div v-if="actualIsRead" class="read-indicator">✓ 已读</div>

    <!-- 链接按钮 - 根据来源跳转 -->
    <button class="x-link-btn" @click.stop="openTweetLink"
      :title="tweet.source === 'xueqiu' ? '在雪球网打开' : '在 X.com 打开'">
      <span v-if="tweet.source === 'xueqiu'" class="xueqiu-icon">❄️</span>
      <svg v-else viewBox="0 0 24 24" fill="currentColor">
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
      <p v-html="formatText(displayText, props.tweet.entities)"></p>
    </div>

    <!-- 文章卡片 -->
    <div v-if="props.tweet.article" class="article-card" @click.stop="openArticle">
      <div v-if="props.tweet.article.coverImage" class="article-cover">
        <img :src="props.tweet.article.coverImage" alt="Article cover" loading="lazy" />
      </div>
      <div class="article-content">
        <h3 class="article-title">{{ props.tweet.article.title }}</h3>
        <p v-if="props.tweet.article.description" class="article-description">
          {{ props.tweet.article.description }}
        </p>
        <span class="article-link">阅读文章 →</span>
      </div>
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
import { ref, computed, watch } from 'vue'
import { markTwitterPostRead, markXueqiuPostRead } from '../api/tweets.js'

const props = defineProps({
  tweet: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-tweet', 'update:isRead'])

const lightboxOpen = ref(false)
const lightboxImage = ref(null)
// 内部已读状态（用于三连击切换）
const internalIsRead = ref(props.tweet.is_read || props.isRead || false)

// 计算实际的已读状态（优先使用外部传入的）
const actualIsRead = computed(() => {
  return props.isRead || internalIsRead.value
})

// 监听外部 isRead 变化，同步到内部状态
watch(() => props.isRead, (newVal) => {
  internalIsRead.value = newVal
})

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

  return text
})

function openTweetLink() {
  if (props.tweet.source === 'xueqiu') {
    window.open(`https://xueqiu.com/s/${props.tweet.userId}/${props.tweet.id}`, '_blank')
  } else {
    window.open(`https://x.com/i/web/status/${props.tweet.id}`, '_blank')
  }
}

// 打开文章链接
function openArticle() {
  if (props.tweet.article?.url) {
    window.open(props.tweet.article.url, '_blank')
  }
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
    const newReadState = !internalIsRead.value
    internalIsRead.value = newReadState
    // 通知父组件状态变更
    emit('update:isRead', newReadState)

    try {
      if (props.tweet.source === 'xueqiu') {
        await markXueqiuPostRead(props.tweet.id, newReadState)
      } else {
        await markTwitterPostRead(props.tweet.id, newReadState)
      }
    } catch (err) {
      console.error('标记已读/未读失败:', err)
      // 如果失败，回滚状态
      internalIsRead.value = !newReadState
      emit('update:isRead', !newReadState)
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

/**
 * 解码 HTML 实体
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  }
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, match => entities[match] || match)
}

/**
 * 格式化推文文本
 * 1. 解码 HTML 实体
 * 2. 处理 @提及 和 URL（优先使用 entities 数据）
 * 3. 高亮话题标签
 */
function formatText(text, entities = null) {
  if (!text) return ''

  // 解码 HTML 实体
  let formattedText = decodeHtmlEntities(text)

  // 如果有 entities 数据，使用它来准确处理提及和链接
  if (entities) {
    // 处理 URLs
    if (entities.urls && entities.urls.length > 0) {
      for (const url of entities.urls) {
        const displayUrl = url.display_url || url.expanded_url || url.url
        formattedText = formattedText.replace(
          url.url,
          `<a href="${url.expanded_url || url.url}" target="_blank" class="url-link" onclick="event.stopPropagation()">${displayUrl}</a>`
        )
      }
    }

    // 处理用户提及
    if (entities.user_mentions && entities.user_mentions.length > 0) {
      for (const mention of entities.user_mentions) {
        const screenName = mention.screen_name
        formattedText = formattedText.replace(
          new RegExp(`@${screenName}`, 'g'),
          `<a href="https://x.com/${screenName}" target="_blank" class="mention-link" onclick="event.stopPropagation()">@${screenName}</a>`
        )
      }
    }

    // 处理话题标签
    if (entities.hashtags && entities.hashtags.length > 0) {
      for (const hashtag of entities.hashtags) {
        const tag = hashtag.text
        formattedText = formattedText.replace(
          new RegExp(`#${tag}`, 'g'),
          `<span class="hashtag">#${tag}</span>`
        )
      }
    }
  } else {
    // 没有 entities 时的兜底处理
    formattedText = formattedText
      .replace(/@(\w+)/g, '<a href="https://x.com/$1" target="_blank" class="mention-link" onclick="event.stopPropagation()">@$1</a>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="url-link" onclick="event.stopPropagation()">$1</a>')
      .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
  }

  return formattedText.replace(/\n/g, '<br>')
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

.xueqiu-icon {
  font-size: 16px;
  line-height: 1;
  display: block;
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

.tweet-content :deep(.url-link) {
  color: #1d9bf0;
  text-decoration: none;
  word-break: break-all;
}

.tweet-content :deep(.url-link:hover) {
  text-decoration: underline;
}

/* 文章卡片 */
.article-card {
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s;
  background: #fff;
}

.article-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.article-cover {
  width: 100%;
  max-height: 200px;
  overflow: hidden;
}

.article-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-content {
  padding: 12px 16px;
}

.article-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f1419;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.article-description {
  font-size: 14px;
  color: #536471;
  margin: 0 0 12px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-link {
  font-size: 14px;
  color: #1d9bf0;
  font-weight: 500;
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
