package com.xueqiu.xforyou.ui.auth

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.xueqiu.xforyou.data.local.SettingsDataStore
import com.xueqiu.xforyou.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val settingsDataStore: SettingsDataStore
) : ViewModel() {

    private val _isLoading = mutableStateOf(false)
    val isLoading: State<Boolean> = _isLoading

    private val _error = mutableStateOf<String?>(null)
    val error: State<String?> = _error

    private val _isSetupMode = mutableStateOf<Boolean?>(null)
    val isSetupMode: State<Boolean?> = _isSetupMode

    private val _isLoggedIn = mutableStateOf(false)
    val isLoggedIn: State<Boolean> = _isLoggedIn

    private val _baseUrl = mutableStateOf(settingsDataStore.baseUrl)
    val baseUrl: State<String> = _baseUrl

    init {
        checkAuthStatus()
    }

    fun saveBaseUrl(url: String) {
        settingsDataStore.baseUrl = url
        _baseUrl.value = url
        // 重新检查登录状态（连接到新后端）
        _isLoggedIn.value = false
        _isSetupMode.value = null
        _error.value = "后端地址已更改，请重新登录"
    }

    private fun checkAuthStatus() {
        viewModelScope.launch {
            _isLoading.value = true

            // 先检查是否有 token
            if (!authRepository.isLoggedIn()) {
                // 没有 token，检查是否需要设置密码
                checkHasPassword()
            } else {
                // 有 token，验证是否有效
                val isValid = authRepository.verifyToken()
                if (isValid) {
                    _isLoggedIn.value = true
                } else {
                    // token 无效，检查是否需要设置密码
                    checkHasPassword()
                }
            }

            _isLoading.value = false
        }
    }

    private suspend fun checkHasPassword() {
        authRepository.hasPassword()
            .onSuccess { hasPassword ->
                _isSetupMode.value = !hasPassword
            }
            .onFailure {
                _error.value = "检查密码状态失败"
                _isSetupMode.value = false
            }
    }

    fun login(password: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            authRepository.login(password)
                .onSuccess {
                    _isLoggedIn.value = true
                }
                .onFailure { e ->
                    _error.value = e.message ?: "登录失败"
                }

            _isLoading.value = false
        }
    }

    fun setPassword(password: String, confirmPassword: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            // 验证密码
            if (password.length < 4) {
                _error.value = "密码至少4位"
                _isLoading.value = false
                return@launch
            }

            if (password != confirmPassword) {
                _error.value = "两次密码不一致"
                _isLoading.value = false
                return@launch
            }

            authRepository.setPassword(password)
                .onSuccess {
                    _isLoggedIn.value = true
                }
                .onFailure { e ->
                    _error.value = e.message ?: "设置密码失败"
                }

            _isLoading.value = false
        }
    }

    fun clearError() {
        _error.value = null
    }

    fun logout() {
        authRepository.logout()
        _isLoggedIn.value = false
        _isSetupMode.value = null
        checkAuthStatus()
    }
}
