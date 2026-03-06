package com.xueqiu.xforyou.data.repository;

import com.xueqiu.xforyou.data.api.ApiService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava"
})
public final class TweetRepository_Factory implements Factory<TweetRepository> {
  private final Provider<ApiService> apiServiceProvider;

  public TweetRepository_Factory(Provider<ApiService> apiServiceProvider) {
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public TweetRepository get() {
    return newInstance(apiServiceProvider.get());
  }

  public static TweetRepository_Factory create(Provider<ApiService> apiServiceProvider) {
    return new TweetRepository_Factory(apiServiceProvider);
  }

  public static TweetRepository newInstance(ApiService apiService) {
    return new TweetRepository(apiService);
  }
}
