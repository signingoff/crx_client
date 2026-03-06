package com.xueqiu.xforyou.data.repository;

import com.xueqiu.xforyou.data.api.AuthApiService;
import com.xueqiu.xforyou.data.local.AuthDataStore;
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
public final class AuthRepository_Factory implements Factory<AuthRepository> {
  private final Provider<AuthApiService> authApiServiceProvider;

  private final Provider<AuthDataStore> authDataStoreProvider;

  public AuthRepository_Factory(Provider<AuthApiService> authApiServiceProvider,
      Provider<AuthDataStore> authDataStoreProvider) {
    this.authApiServiceProvider = authApiServiceProvider;
    this.authDataStoreProvider = authDataStoreProvider;
  }

  @Override
  public AuthRepository get() {
    return newInstance(authApiServiceProvider.get(), authDataStoreProvider.get());
  }

  public static AuthRepository_Factory create(Provider<AuthApiService> authApiServiceProvider,
      Provider<AuthDataStore> authDataStoreProvider) {
    return new AuthRepository_Factory(authApiServiceProvider, authDataStoreProvider);
  }

  public static AuthRepository newInstance(AuthApiService authApiService,
      AuthDataStore authDataStore) {
    return new AuthRepository(authApiService, authDataStore);
  }
}
