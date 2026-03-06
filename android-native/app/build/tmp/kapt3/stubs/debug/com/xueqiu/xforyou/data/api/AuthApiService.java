package com.xueqiu.xforyou.data.api;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00004\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\u0018\u0002\n\u0002\b\u0002\bf\u0018\u00002\u00020\u0001J\u001a\u0010\u0002\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00050\u00040\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0006J$\u0010\u0007\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u00040\u00032\b\b\u0001\u0010\t\u001a\u00020\nH\u00a7@\u00a2\u0006\u0002\u0010\u000bJ$\u0010\f\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u00040\u00032\b\b\u0001\u0010\t\u001a\u00020\nH\u00a7@\u00a2\u0006\u0002\u0010\u000bJ$\u0010\r\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u000e0\u00040\u00032\b\b\u0001\u0010\t\u001a\u00020\u000fH\u00a7@\u00a2\u0006\u0002\u0010\u0010\u00a8\u0006\u0011"}, d2 = {"Lcom/xueqiu/xforyou/data/api/AuthApiService;", "", "hasPassword", "Lretrofit2/Response;", "Lcom/xueqiu/xforyou/data/model/ApiResponse;", "Lcom/xueqiu/xforyou/data/api/HasPasswordResponse;", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "login", "Lcom/xueqiu/xforyou/data/api/LoginResponse;", "body", "Lcom/xueqiu/xforyou/data/api/PasswordRequest;", "(Lcom/xueqiu/xforyou/data/api/PasswordRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "setPassword", "verifyToken", "", "Lcom/xueqiu/xforyou/data/api/TokenRequest;", "(Lcom/xueqiu/xforyou/data/api/TokenRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public abstract interface AuthApiService {
    
    @retrofit2.http.GET(value = "auth/has-password")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object hasPassword(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xueqiu.xforyou.data.model.ApiResponse<com.xueqiu.xforyou.data.api.HasPasswordResponse>>> $completion);
    
    @retrofit2.http.POST(value = "auth/set-password")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object setPassword(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.xueqiu.xforyou.data.api.PasswordRequest body, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xueqiu.xforyou.data.model.ApiResponse<com.xueqiu.xforyou.data.api.LoginResponse>>> $completion);
    
    @retrofit2.http.POST(value = "auth/login")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object login(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.xueqiu.xforyou.data.api.PasswordRequest body, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xueqiu.xforyou.data.model.ApiResponse<com.xueqiu.xforyou.data.api.LoginResponse>>> $completion);
    
    @retrofit2.http.POST(value = "auth/verify")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object verifyToken(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.xueqiu.xforyou.data.api.TokenRequest body, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.xueqiu.xforyou.data.model.ApiResponse<java.lang.Boolean>>> $completion);
}