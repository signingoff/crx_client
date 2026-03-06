package com.xueqiu.xforyou.data.api

import com.xueqiu.xforyou.data.model.ApiResponse
import com.xueqiu.xforyou.data.model.MarkReadRequest
import com.xueqiu.xforyou.data.model.Tweet
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {
    @GET("twitter/posts")
    suspend fun getTwitterPosts(): Response<ApiResponse<List<Tweet>>>

    @GET("xueqiu/posts")
    suspend fun getXueqiuPosts(): Response<ApiResponse<List<Tweet>>>

    @POST("twitter/posts/{id}/read")
    suspend fun markTwitterRead(
        @Path("id") id: String,
        @Body body: MarkReadRequest
    ): Response<ApiResponse<Unit>>

    @POST("xueqiu/posts/{id}/read")
    suspend fun markXueqiuRead(
        @Path("id") id: String,
        @Body body: MarkReadRequest
    ): Response<ApiResponse<Unit>>
}
