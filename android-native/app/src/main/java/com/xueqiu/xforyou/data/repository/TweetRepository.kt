package com.xueqiu.xforyou.data.repository

import com.xueqiu.xforyou.data.api.ApiService
import com.xueqiu.xforyou.data.model.Tweet
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TweetRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getTwitterPosts(page: Int = 1, limit: Int = 20): Result<List<Tweet>> {
        return try {
            val response = apiService.getTwitterPosts(page, limit)
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true) {
                    Result.success(body.data ?: emptyList())
                } else {
                    Result.failure(Exception(body?.error ?: "Unknown error"))
                }
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Network error"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getXueqiuPosts(page: Int = 1, limit: Int = 20): Result<List<Tweet>> {
        return try {
            val response = apiService.getXueqiuPosts(page, limit)
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true) {
                    Result.success(body.data ?: emptyList())
                } else {
                    Result.failure(Exception(body?.error ?: "Unknown error"))
                }
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Network error"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
