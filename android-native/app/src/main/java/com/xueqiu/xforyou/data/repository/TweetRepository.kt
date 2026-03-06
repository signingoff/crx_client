package com.xueqiu.xforyou.data.repository

import com.xueqiu.xforyou.data.api.ApiService
import com.xueqiu.xforyou.data.model.MarkReadRequest
import com.xueqiu.xforyou.data.model.Tweet
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TweetRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getTwitterPosts(): Result<List<Tweet>> {
        return try {
            val response = apiService.getTwitterPosts()
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

    suspend fun getXueqiuPosts(): Result<List<Tweet>> {
        return try {
            val response = apiService.getXueqiuPosts()
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

    suspend fun markTwitterRead(id: String, isRead: Boolean): Result<Unit> {
        return try {
            val response = apiService.markTwitterRead(id, MarkReadRequest(isRead))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to mark read"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markXueqiuRead(id: String, isRead: Boolean): Result<Unit> {
        return try {
            val response = apiService.markXueqiuRead(id, MarkReadRequest(isRead))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to mark read"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
