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

    // 清空容器
    tweetContainer.value.innerHTML = ''

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
    if (!result) {
      console.warn(`Tweet ${props.tweetId} could not be embedded`)
    }

    loading.value = false
  } catch (err) {
    console.error('Error embedding tweet:', err)
    // 出错时清空容器
    if (tweetContainer.value) {
      tweetContainer.value.innerHTML = ''
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
</style>
