package com.xueqiu.xforyou.di;

import com.xueqiu.xforyou.data.local.SettingsDataStore;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import okhttp3.OkHttpClient;
import retrofit2.Retrofit;

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
public final class NetworkModule_ProvideRetrofitFactory implements Factory<Retrofit> {
  private final Provider<OkHttpClient> clientProvider;

  private final Provider<SettingsDataStore> settingsDataStoreProvider;

  public NetworkModule_ProvideRetrofitFactory(Provider<OkHttpClient> clientProvider,
      Provider<SettingsDataStore> settingsDataStoreProvider) {
    this.clientProvider = clientProvider;
    this.settingsDataStoreProvider = settingsDataStoreProvider;
  }

  @Override
  public Retrofit get() {
    return provideRetrofit(clientProvider.get(), settingsDataStoreProvider.get());
  }

  public static NetworkModule_ProvideRetrofitFactory create(Provider<OkHttpClient> clientProvider,
      Provider<SettingsDataStore> settingsDataStoreProvider) {
    return new NetworkModule_ProvideRetrofitFactory(clientProvider, settingsDataStoreProvider);
  }

  public static Retrofit provideRetrofit(OkHttpClient client, SettingsDataStore settingsDataStore) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideRetrofit(client, settingsDataStore));
  }
}
