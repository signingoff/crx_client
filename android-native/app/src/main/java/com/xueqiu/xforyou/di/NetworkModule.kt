package com.xueqiu.xforyou.di

import com.xueqiu.xforyou.data.api.ApiService
import com.xueqiu.xforyou.data.api.AuthApiService
import com.xueqiu.xforyou.data.local.AuthDataStore
import com.xueqiu.xforyou.data.local.SettingsDataStore
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideAuthInterceptor(authDataStore: AuthDataStore): Interceptor {
        return Interceptor { chain ->
            val request = chain.request()
            val token = authDataStore.authToken

            val newRequest = if (token != null && !request.url.encodedPath.contains("/auth/")) {
                request.newBuilder()
                    .header("Authorization", "Bearer $token")
                    .build()
            } else {
                request
            }

            chain.proceed(newRequest)
        }
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: Interceptor): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(logging)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient, settingsDataStore: SettingsDataStore): Retrofit {
        return Retrofit.Builder()
            .baseUrl(settingsDataStore.baseUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideAuthApiService(retrofit: Retrofit): AuthApiService {
        return retrofit.create(AuthApiService::class.java)
    }
}
