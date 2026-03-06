# TweetCard 组件

**文件**: `android-native/app/src/main/java/com/xueqiu/xforyou/ui/components/TweetCard.kt`

## 功能

- 推文/帖子卡片展示
- 图片网格布局（1-4 张）
- 点击打开 Lightbox 查看大图
- 来源感知图标（❄️ 雪球 / 𝕏 X）
- 跳转原帖按钮
- 长文本展开/收起

## 参数

```kotlin
@Composable
fun TweetCard(
    tweet: Tweet,
    isSelected: Boolean = false,
    isRead: Boolean = false,
    onClick: () -> Unit = {},
    onImageClick: (List<Media>, Int) -> Unit = { _, _ -> }
)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| tweet | Tweet | 推文数据 |
| isSelected | Boolean | 是否选中 |
| isRead | Boolean | 是否已读 |
| onClick | () -> Unit | 点击回调 |
| onImageClick | (List<Media>, Int) -> Unit | 图片点击回调 |

## 使用示例

```kotlin
TweetCard(
    tweet = tweet,
    isRead = tweet.isRead,
    onClick = { viewModel.selectTweet(tweet) },
    onImageClick = { media, index ->
        viewModel.showLightbox(media, index)
    }
)
```

## 图片布局规则

| 图片数 | 布局 |
|--------|------|
| 1 张 | 全宽，max-height: 400dp |
| 2 张 | 等分两列 |
| 3 张 | 首图跨两列 |
| 4 张 | 2x2 网格 |
