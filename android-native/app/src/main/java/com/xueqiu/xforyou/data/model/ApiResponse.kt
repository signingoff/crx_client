package com.xueqiu.xforyou.data.model

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null
)

data class MarkReadRequest(
    val isRead: Boolean
)
