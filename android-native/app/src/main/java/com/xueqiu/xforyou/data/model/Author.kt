package com.xueqiu.xforyou.data.model

data class Author(
    val id: String,
    val name: String,
    val username: String,
    val avatar: String,
    val description: String? = null,
    val followersCount: Int? = null,
    val followingCount: Int? = null
)
