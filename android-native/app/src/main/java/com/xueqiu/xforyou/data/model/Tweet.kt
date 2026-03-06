package com.xueqiu.xforyou.data.model

data class Tweet(
    val id: String,
    val text: String,
    val createdAt: String,
    val author: Author,
    val isRead: Boolean = false,
    val source: String = "twitter",
    val media: List<Media> = emptyList(),
    val metrics: Metrics? = null
)

data class Metrics(
    val replies: Int? = null,
    val retweets: Int? = null,
    val likes: Int? = null
)
