package com.xueqiu.xforyou.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.xueqiu.xforyou.data.model.Tweet
import com.xueqiu.xforyou.ui.theme.Success
import com.xueqiu.xforyou.ui.theme.TextSecondary
import com.xueqiu.xforyou.ui.theme.TwitterBlue
import java.text.SimpleDateFormat
import java.util.*

private const val MAX_LINES_COLLAPSED = 5 // 收起时最大行数

@Composable
fun TweetCard(
    tweet: Tweet,
    modifier: Modifier = Modifier
) {
    var isExpanded by remember { mutableStateOf(false) }
    var isTextOverflown by remember { mutableStateOf(false) }
    val context = LocalContext.current

    Card(
        modifier = modifier
            .fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // 作者信息行
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 头像
                AsyncImage(
                    model = tweet.author.avatar,
                    contentDescription = "Avatar",
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )

                Spacer(modifier = Modifier.width(12.dp))

                // 作者名和用户名
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = tweet.author.name,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "@${tweet.author.username}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }

                // 来源图标和跳转按钮
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // 来源图标（❄️ 雪球 或 X）
                    SourceIcon(source = tweet.source)

                    // 跳转原推文按钮
                    IconButton(
                        onClick = { openOriginalPost(context, tweet) }
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                            contentDescription = "查看原文",
                            tint = TwitterBlue
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 推文内容（可点击的 @用户名、#话题标签、URL）
            ClickableTweetText(
                text = tweet.text,
                maxLines = if (isExpanded) Int.MAX_VALUE else MAX_LINES_COLLAPSED,
                modifier = Modifier.fillMaxWidth()
            )

            // Show more/less 按钮（仅当文本溢出时显示）
            if (isTextOverflown || isExpanded) {
                Text(
                    text = if (isExpanded) "收起" else "显示更多",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TwitterBlue,
                    modifier = Modifier
                        .clickable { isExpanded = !isExpanded }
                        .padding(top = 4.dp)
                )
            }

            // 媒体图片
            if (tweet.media.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                MediaGrid(media = tweet.media)
            }

            Spacer(modifier = Modifier.height(4.dp))

            // 底部：时间、已读标记
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = formatTime(tweet.createdAt),
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )

                if (tweet.isRead) {
                    Text(
                        text = "✓",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Success
                    )
                }
            }
        }
    }
}

/**
 * 来源图标：❄️ 雪球 或 X
 */
@Composable
private fun SourceIcon(source: String) {
    when (source.lowercase()) {
        "xueqiu" -> {
            Text(
                text = "❄️",
                style = MaterialTheme.typography.titleMedium
            )
        }
        else -> {
            // X (Twitter) 图标 - 使用简化的 X 形状
            Text(
                text = "𝕏",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

/**
 * 打开原推文/帖子
 */
private fun openOriginalPost(context: android.content.Context, tweet: Tweet) {
    val url = when (tweet.source.lowercase()) {
        "xueqiu" -> "https://xueqiu.com/${tweet.author.id}/${tweet.id}"
        else -> "https://x.com/${tweet.author.username}/status/${tweet.id}"
    }
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
    context.startActivity(intent)
}

@Composable
private fun MediaGrid(media: List<com.xueqiu.xforyou.data.model.Media>) {
    val displayMedia = media.take(4)
    val columns = if (displayMedia.size == 1) 1 else 2
    var selectedImageUrl by remember { mutableStateOf<String?>(null) }

    Column(
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        displayMedia.chunked(columns).forEach { rowMedia ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                rowMedia.forEach { m ->
                    AsyncImage(
                        model = m.url,
                        contentDescription = "Media",
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { selectedImageUrl = m.url },
                        contentScale = ContentScale.Crop
                    )
                }
            }
        }
    }

    // Lightbox
    selectedImageUrl?.let { url ->
        ImageLightbox(
            imageUrl = url,
            onDismiss = { selectedImageUrl = null }
        )
    }
}

private fun formatTime(isoTime: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        inputFormat.timeZone = TimeZone.getTimeZone("UTC")
        val date = inputFormat.parse(isoTime)

        val outputFormat = SimpleDateFormat("MM-dd HH:mm", Locale.getDefault())
        outputFormat.format(date!!)
    } catch (e: Exception) {
        isoTime
    }
}
