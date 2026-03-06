package com.xueqiu.xforyou.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.xueqiu.xforyou.data.model.Tweet
import com.xueqiu.xforyou.ui.theme.Success
import com.xueqiu.xforyou.ui.theme.TextSecondary
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

private const val TRIPLE_CLICK_TIMEOUT = 500L // 500ms 内完成三连击

@Composable
fun TweetCard(
    tweet: Tweet,
    onTripleClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var clickCount by remember { mutableIntStateOf(0) }
    var lastClickTime by remember { mutableLongStateOf(0L) }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable {
                val currentTime = System.currentTimeMillis()
                if (currentTime - lastClickTime > TRIPLE_CLICK_TIMEOUT) {
                    clickCount = 1
                } else {
                    clickCount++
                    if (clickCount >= 3) {
                        onTripleClick()
                        clickCount = 0
                    }
                }
                lastClickTime = currentTime
            },
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

                // 时间和已读标记
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = formatTime(tweet.createdAt),
                        style = MaterialTheme.typography.bodyMedium,
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

            Spacer(modifier = Modifier.height(8.dp))

            // 推文内容
            Text(
                text = tweet.text,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 5,
                overflow = TextOverflow.Ellipsis
            )

            // 媒体图片
            if (tweet.media.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                MediaGrid(media = tweet.media)
            }
        }
    }
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
