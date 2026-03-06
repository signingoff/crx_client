# TweetList 组件详情

## 功能特性

### 自动刷新

每 8 秒轮询数据库获取新推文。

```javascript
// 内部实现
let refreshInterval = setInterval(loadTweets, 8000)
```

### 已读同步

每 5 秒查询服务器已读状态，更新本地显示。

```javascript
// 解决多客户端/多标签页同步问题
async function syncReadStatus() {
  const tweetIds = tweets.value.map(t => t.id)
  const statusMap = await fetchReadStatus(tweetIds)
  // 更新本地状态
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `selectedId` | String | null | 当前选中的推文 ID |

## Emits

| 事件 | 参数 | 说明 |
|------|------|------|
| `select-tweet` | `id: string` | 选择推文 |

## 使用示例

```vue
<script setup>
import { ref } from 'vue'
import TweetList from '../components/TweetList.vue'

const selectedId = ref(null)

function onSelectTweet(id) {
  selectedId.value = id
}
</script>

<template>
  <TweetList
    :selected-id="selectedId"
    @select-tweet="onSelectTweet"
  />
</template>
```
