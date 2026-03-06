package com.xueqiu.xforyou.ui.settings

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import com.xueqiu.xforyou.data.local.SettingsDataStore
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsDataStore: SettingsDataStore
) : ViewModel() {

    private val _baseUrl = mutableStateOf(settingsDataStore.baseUrl)
    val baseUrl: State<String> = _baseUrl

    fun saveBaseUrl(url: String) {
        var cleanUrl = url.trim()
        if (!cleanUrl.endsWith("/")) {
            cleanUrl += "/"
        }
        settingsDataStore.baseUrl = cleanUrl
        _baseUrl.value = cleanUrl
    }

    fun getDefaultBaseUrl(): String {
        return SettingsDataStore.DEFAULT_BASE_URL
    }
}
