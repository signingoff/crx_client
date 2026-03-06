package com.xueqiu.xforyou.data.api

import com.xueqiu.xforyou.data.model.ApiResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

data class PasswordRequest(val password: String)
data class TokenRequest(val token: String)
data class HasPasswordResponse(val hasPassword: Boolean)
data class LoginResponse(val token: String)

interface AuthApiService {
    @GET("auth/has-password")
    suspend fun hasPassword(): Response<ApiResponse<HasPasswordResponse>>

    @POST("auth/set-password")
    suspend fun setPassword(@Body body: PasswordRequest): Response<ApiResponse<LoginResponse>>

    @POST("auth/login")
    suspend fun login(@Body body: PasswordRequest): Response<ApiResponse<LoginResponse>>

    @POST("auth/verify")
    suspend fun verifyToken(@Body body: TokenRequest): Response<ApiResponse<Boolean>>
}
