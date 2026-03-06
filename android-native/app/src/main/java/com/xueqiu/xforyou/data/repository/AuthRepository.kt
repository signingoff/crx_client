package com.xueqiu.xforyou.data.repository

import com.xueqiu.xforyou.data.api.AuthApiService
import com.xueqiu.xforyou.data.api.PasswordRequest
import com.xueqiu.xforyou.data.api.TokenRequest
import com.xueqiu.xforyou.data.local.AuthDataStore
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApiService: AuthApiService,
    private val authDataStore: AuthDataStore
) {
    suspend fun hasPassword(): Result<Boolean> {
        return try {
            val response = authApiService.hasPassword()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true) {
                    Result.success(body.data?.hasPassword ?: false)
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

    suspend fun setPassword(password: String): Result<Unit> {
        return try {
            val response = authApiService.setPassword(PasswordRequest(password))
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true) {
                    body.data?.token?.let { token ->
                        authDataStore.authToken = token
                    }
                    Result.success(Unit)
                } else {
                    Result.failure(Exception(body?.error ?: "Set password failed"))
                }
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Network error"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun login(password: String): Result<Unit> {
        return try {
            val response = authApiService.login(PasswordRequest(password))
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true) {
                    body.data?.token?.let { token ->
                        authDataStore.authToken = token
                    }
                    Result.success(Unit)
                } else {
                    Result.failure(Exception(body?.error ?: "Login failed"))
                }
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Network error"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyToken(): Boolean {
        val token = authDataStore.authToken ?: return false
        return try {
            val response = authApiService.verifyToken(TokenRequest(token))
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data == true) {
                    true
                } else {
                    authDataStore.clearToken()
                    false
                }
            } else {
                authDataStore.clearToken()
                false
            }
        } catch (e: Exception) {
            authDataStore.clearToken()
            false
        }
    }

    fun logout() {
        authDataStore.clearToken()
    }

    fun isLoggedIn(): Boolean {
        return authDataStore.isLoggedIn()
    }

    fun getToken(): String? {
        return authDataStore.authToken
    }
}
