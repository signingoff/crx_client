package com.xueqiu.xforyou.data.model

data class Media(
    val type: String, // "photo", "video", "animated_gif"
    val url: String,
    val previewUrl: String? = null
)
