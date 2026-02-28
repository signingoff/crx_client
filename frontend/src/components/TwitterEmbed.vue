<template>
  <div ref="tweetContainer" class="twitter-embed">
    <div v-if="loading" class="loading">加载推文中...</div>
    <div v-if="error" class="error">加载失败: {{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  tweetId: {
    type: String,
    required: true
  },
  options: {
    type: Object,
    default: () => ({
      theme: 'light',
      cards: 'visible',
      conversation: 'none',
      align: 'center',
      width: '100%'
    })
  }
})

const tweetContainer = ref(null)
const loading = ref(true)
const error = ref(null)

// 加载 Twitter 嵌入脚本
function loadTwitterScript() {
  return new Promise((resolve, reject) => {
    if (window.twttr) {
      resolve(window.twttr)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.onload = () => resolve(window.twttr)
    script.onerror = () => reject(new Error('Failed to load Twitter widgets'))
    document.head.appendChild(script)
  })
}

// 嵌入推文
async function embedTweet() {
  if (!tweetContainer.value) return

  loading.value = true
  error.value = null

  try {
    const twttr = await loadTwitterScript()

    // 清空容器，但保留一个备用链接
    const tweetUrl = `https://x.com/i/web/status/${props.tweetId}`
    tweetContainer.value.innerHTML = `
      <div class="tweet-fallback">
        <a href="${tweetUrl}" target="_blank" class="tweet-link">
          查看推文 #${props.tweetId}
        </a>
      </div>
    `

    // 创建推文嵌入
    const result = await twttr.widgets.createTweet(
      props.tweetId,
      tweetContainer.value,
      {
        theme: props.options.theme,
        cards: props.options.cards,
        conversation: props.options.conversation,
        align: props.options.align,
        width: props.options.width,
        dnt: true
      }
    )

    // 如果 createTweet 返回 null，说明推文无法加载
    // 但我们已经保留了备用链接
    if (!result) {
      console.warn(`Tweet ${props.tweetId} could not be embedded`)
    }

    loading.value = false
  } catch (err) {
    console.error('Error embedding tweet:', err)
    // 即使出错，也显示备用链接
    const tweetUrl = `https://x.com/i/web/status/${props.tweetId}`
    if (tweetContainer.value) {
      tweetContainer.value.innerHTML = `
        <div class="tweet-fallback">
          <a href="${tweetUrl}" target="_blank" class="tweet-link">
            查看推文 #${props.tweetId}
          </a>
          <div class="error-hint">Twitter 嵌入加载失败</div>
        </div>
      `
    }
    loading.value = false
  }
}

onMounted(() => {
  embedTweet()
})

watch(() => props.tweetId, () => {
  embedTweet()
})
</script>

<style scoped>
.twitter-embed {
  min-height: 100px;
  margin: 16px 0;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #536471;
}

.error {
  text-align: center;
  padding: 20px;
  color: #f4212e;
  background: #ffe5e5;
  border-radius: 8px;
}

.tweet-fallback {
  text-align: center;
  padding: 20px;
  background: #f7f9fa;
  border-radius: 8px;
  border: 1px solid #e1e8ed;
}

.tweet-link {
  color: #1d9bf0;
  text-decoration: none;
  font-weight: 500;
}

.tweet-link:hover {
  text-decoration: underline;
}

.error-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #536471;
}
</style>
