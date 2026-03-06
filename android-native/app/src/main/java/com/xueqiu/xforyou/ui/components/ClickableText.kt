package com.xueqiu.xforyou.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.text.ClickableText
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import com.xueqiu.xforyou.ui.theme.TwitterBlue

/**
 * 可点击的推文文本组件
 * 支持 @用户名、#话题标签、URL 的点击
 */
@Composable
fun ClickableTweetText(
    text: String,
    modifier: Modifier = Modifier,
    maxLines: Int = Int.MAX_VALUE
) {
    val context = LocalContext.current

    // 解析文本中的特殊元素
    val annotatedString = buildAnnotatedString {
        var remainingText = text
        var lastIndex = 0

        // 正则表达式匹配 @用户名、#话题标签、URL
        val pattern = Regex("(@[\\w_]+)|(#[\\w\u4e00-\u9fa5]+)|(https?://[^\\s]+)")
        val matches = pattern.findAll(text).toList()

        if (matches.isEmpty()) {
            append(text)
            return@buildAnnotatedString
        }

        for (match in matches) {
            // 添加匹配前的普通文本
            append(text.substring(lastIndex, match.range.first))

            val matchedText = match.value
            when {
                matchedText.startsWith("@") -> {
                    // @用户名
                    pushStringAnnotation(tag = "username", annotation = matchedText.substring(1))
                    withStyle(
                        style = SpanStyle(
                            color = TwitterBlue,
                            textDecoration = TextDecoration.None
                        )
                    ) {
                        append(matchedText)
                    }
                    pop()
                }
                matchedText.startsWith("#") -> {
                    // #话题标签
                    pushStringAnnotation(tag = "hashtag", annotation = matchedText.substring(1))
                    withStyle(
                        style = SpanStyle(
                            color = TwitterBlue,
                            textDecoration = TextDecoration.None
                        )
                    ) {
                        append(matchedText)
                    }
                    pop()
                }
                matchedText.startsWith("http") -> {
                    // URL
                    pushStringAnnotation(tag = "url", annotation = matchedText)
                    withStyle(
                        style = SpanStyle(
                            color = TwitterBlue,
                            textDecoration = TextDecoration.Underline
                        )
                    ) {
                        append(matchedText)
                    }
                    pop()
                }
            }
            lastIndex = match.range.last + 1
        }

        // 添加剩余文本
        if (lastIndex < text.length) {
            append(text.substring(lastIndex))
        }
    }

    ClickableText(
        text = annotatedString,
        style = MaterialTheme.typography.bodyLarge.copy(
            color = MaterialTheme.colorScheme.onSurface
        ),
        maxLines = maxLines,
        modifier = modifier,
        onClick = { offset ->
            annotatedString.getStringAnnotations(tag = "username", start = offset, end = offset)
                .firstOrNull()?.let { annotation ->
                    // 点击 @用户名，跳转到 X 用户主页
                    val url = "https://x.com/${annotation.item}"
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    context.startActivity(intent)
                }

            annotatedString.getStringAnnotations(tag = "hashtag", start = offset, end = offset)
                .firstOrNull()?.let { annotation ->
                    // 点击 #话题标签，跳转到 X 话题页面
                    val url = "https://x.com/search?q=%23${annotation.item}"
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    context.startActivity(intent)
                }

            annotatedString.getStringAnnotations(tag = "url", start = offset, end = offset)
                .firstOrNull()?.let { annotation ->
                    // 点击 URL，打开浏览器
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(annotation.item))
                    context.startActivity(intent)
                }
        }
    )
}
