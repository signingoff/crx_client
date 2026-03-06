# TweetCard 组件详情

## Props 详细说明

### tweet

推文数据对象。

```typescript
interface Tweet {
  id: string
  text: string
  createdAt: string
  author: Author
  media?: Media[]
  isRead?: boolean
  source: 'twitter' | 'xueqiu'
}

interface Author {
  id: string
  name: string
  username: string
  avatar: string
  description?: string
  location?: string
  followersCount?: number
  followingCount?: number
}

interface Media {
  type: 'photo'
  url: string
}
```

### isSelected

是否被选中，用于高亮显示。

### isRead

是否已读，控制已读标记显示。

## Emits

| 事件 | 参数 | 说明 |
|------|------|------|
| `select-tweet` | `tweetId: string` | 点击卡片时触发 |
| `update:isRead` | `isRead: boolean` | 已读状态变更时触发 |

## 样式规范

### 颜色变量

| 用途 | 颜色 |
|------|------|
| 边框 | `#e1e8ed` |
| 背景悬停 | `#f7f9fa` |
| 已读标记 | `#00ba7c` |

### 图片布局

| 图片数量 | 布局 |
|---------|------|
| 1张 | 全宽，max-height: 500px |
| 2张 | 等分两列 |
| 3张 | 首图跨两列 |
| 4张 | 2x2 网格 |

## 示例代码

```vue
<script setup>
import { ref } from 'vue'
import TweetCard from '../components/TweetCard.vue'

const selectedId = ref(null)
const tweet = ref({
  id: '123',
  text: '推文内容',
  author: {
    name: '用户名',
    username: 'handle',
    avatar: 'https://example.com/avatar.jpg'
  }
})

function onSelect(id) {
  selectedId.value = id
}
</script>

<template>
  <TweetCard
    :tweet="tweet"
    :is-selected="selectedId === tweet.id"
    @select-tweet="onSelect"
  />
</template>
```
