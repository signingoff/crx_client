package com.xueqiu.xforyou.data.model

data class MonitorUser(
    val id: String? = null,
    val user_id: String? = null,
    val screen_name: String? = null,
    val profile_image_url: String? = null,
    val description: String? = null,
    val followers_count: Int? = 0,
    val friends_count: Int? = 0,
    val statuses_count: Int? = 0,
    val postCount: Int? = 0
)
