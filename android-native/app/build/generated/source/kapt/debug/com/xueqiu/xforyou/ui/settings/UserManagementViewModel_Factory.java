package com.xueqiu.xforyou.ui.settings;

import com.xueqiu.xforyou.data.api.ApiService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
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
public final class UserManagementViewModel_Factory implements Factory<UserManagementViewModel> {
  private final Provider<ApiService> apiServiceProvider;

  public UserManagementViewModel_Factory(Provider<ApiService> apiServiceProvider) {
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public UserManagementViewModel get() {
    return newInstance(apiServiceProvider.get());
  }

  public static UserManagementViewModel_Factory create(Provider<ApiService> apiServiceProvider) {
    return new UserManagementViewModel_Factory(apiServiceProvider);
  }

  public static UserManagementViewModel newInstance(ApiService apiService) {
    return new UserManagementViewModel(apiService);
  }
}
