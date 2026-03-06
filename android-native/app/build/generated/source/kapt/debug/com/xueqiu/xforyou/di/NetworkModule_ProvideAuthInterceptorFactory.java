package com.xueqiu.xforyou.di;

import com.xueqiu.xforyou.data.local.AuthDataStore;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import okhttp3.Interceptor;

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
public final class NetworkModule_ProvideAuthInterceptorFactory implements Factory<Interceptor> {
  private final Provider<AuthDataStore> authDataStoreProvider;

  public NetworkModule_ProvideAuthInterceptorFactory(
      Provider<AuthDataStore> authDataStoreProvider) {
    this.authDataStoreProvider = authDataStoreProvider;
  }

  @Override
  public Interceptor get() {
    return provideAuthInterceptor(authDataStoreProvider.get());
  }

  public static NetworkModule_ProvideAuthInterceptorFactory create(
      Provider<AuthDataStore> authDataStoreProvider) {
    return new NetworkModule_ProvideAuthInterceptorFactory(authDataStoreProvider);
  }

  public static Interceptor provideAuthInterceptor(AuthDataStore authDataStore) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideAuthInterceptor(authDataStore));
  }
}
