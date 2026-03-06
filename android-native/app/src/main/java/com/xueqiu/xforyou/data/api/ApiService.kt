package com.xueqiu.xforyou.data.api

import com.xueqiu.xforyou.data.model.ApiResponse
import com.xueqiu.xforyou.data.model.Tweet
import com.xueqiu.xforyou.data.model.MonitorUser
import com.xueqiu.xforyou.data.model.QueryIdConfig
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {
    // 推文相关（支持分页）
    @GET("twitter/posts")
    suspend fun getTwitterPosts(
        @retrofit2.http.Query("page") page: Int = 1,
        @retrofit2.http.Query("limit") limit: Int = 20
    ): Response<ApiResponse<List<Tweet>>>

    @GET("xueqiu/posts")
    suspend fun getXueqiuPosts(
        @retrofit2.http.Query("page") page: Int = 1,
        @retrofit2.http.Query("limit") limit: Int = 20
    ): Response<ApiResponse<List<Tweet>>>

    // Twitter 用户管理
    @GET("twitter/users")
    suspend fun getTwitterUsers(): Response<ApiResponse<List<MonitorUser>>>

    @POST("twitter/users")
    suspend fun addTwitterUser(@Body user: MonitorUser): Response<ApiResponse<Unit>>

    @DELETE("twitter/users/{id}")
    suspend fun deleteTwitterUser(@Path("id") id: String): Response<ApiResponse<Unit>>

    // 雪球用户管理
    @GET("xueqiu/users")
    suspend fun getXueqiuUsers(): Response<ApiResponse<List<MonitorUser>>>

    @POST("xueqiu/users")
    suspend fun addXueqiuUser(@Body user: MonitorUser): Response<ApiResponse<Unit>>

    @DELETE("xueqiu/users/{id}")
    suspend fun deleteXueqiuUser(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Query ID 配置
    @GET("tweets/queryid-config")
    suspend fun getQueryIdConfig(): Response<ApiResponse<QueryIdConfig>>

    @POST("tweets/queryid-config")
    suspend fun updateQueryIdConfig(@Body config: QueryIdUpdateRequest): Response<ApiResponse<QueryIdConfig>>

    // 同步接口
    @GET("xueqiu/sync")
    suspend fun syncXueqiu(): Response<ApiResponse<Unit>>

    @POST("twitter/users/sync")
    suspend fun syncTwitterUsers(): Response<ApiResponse<Unit>>
}

data class QueryIdUpdateRequest(
    val type: String,
    val queryId: String
)
