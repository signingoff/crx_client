# 常见问题排查

## 图片相关问题

### 缩略图不显示

**症状**：图片区域空白或显示占位符

**原因**：
- URL 缺少 `?name=small` 参数
- 网络无法访问 `pbs.twimg.com`

**解决**：

```javascript
function getThumbnailUrl(url) {
  if (!url) return ''
  if (url.includes('pbs.twimg.com')) {
    return url.includes('?')
      ? url + '&name=small'
      : url + '?name=small'
  }
  return url
}
```

### 单张图片被裁剪

**症状**：单张图片上下/左右被截断

**原因**：使用了 `object-fit: cover` 强制填充

**解决**：

```css
/* 单张图片使用 contain 保持比例 */
.tweet-media.single .media-item {
  aspect-ratio: auto;
  max-height: 500px;
}

.tweet-media.single .media-item img {
  object-fit: contain;
}
```

## 滚动相关问题

### 滚动条样式不生效

**症状**：自定义滚动条样式未应用

**原因**：样式定义在 scoped 样式块中

**解决**：将滚动条样式移至 `App.vue` 全局样式

```css
/* App.vue - 非 scoped */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}
```

## 性能相关问题

### 列表滚动卡顿

**优化建议**：
1. 使用 `v-for` 时添加 `:key`
2. 图片使用懒加载
3. 大数据量考虑虚拟滚动

```vue
<!-- 添加 key -->
<TweetCard
  v-for="tweet in tweets"
  :key="tweet.id"
  :tweet="tweet"
/>
```

## 开发调试

### 查看 API 请求

浏览器 DevTools → Network → 筛选 `localhost:3000`

### 检查响应数据

```javascript
// 在 API 层添加日志
console.log('API response:', response.data)
```
