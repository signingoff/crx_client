package com.xueqiu.xforyou.ui.settings

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.xueqiu.xforyou.data.api.ApiService
import com.xueqiu.xforyou.data.api.QueryIdUpdateRequest
import com.xueqiu.xforyou.data.model.MonitorUser
import com.xueqiu.xforyou.data.model.QueryIdConfig
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class UserManagementViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {

    // Twitter 用户
    private val _twitterUsers = mutableStateOf<List<MonitorUser>>(emptyList())
    val twitterUsers: State<List<MonitorUser>> = _twitterUsers

    // 雪球用户
    private val _xueqiuUsers = mutableStateOf<List<MonitorUser>>(emptyList())
    val xueqiuUsers: State<List<MonitorUser>> = _xueqiuUsers

    // Query ID 配置
    private val _queryIdConfig = mutableStateOf<QueryIdConfig?>(null)
    val queryIdConfig: State<QueryIdConfig?> = _queryIdConfig

    // 加载状态
    private val _isLoading = mutableStateOf(false)
    val isLoading: State<Boolean> = _isLoading

    // 错误信息
    private val _error = mutableStateOf<String?>(null)
    val error: State<String?> = _error

    // 操作成功提示
    private val _successMessage = mutableStateOf<String?>(null)
    val successMessage: State<String?> = _successMessage

    init {
        loadAllData()
    }

    fun loadAllData() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            loadTwitterUsers()
            loadXueqiuUsers()
            loadQueryIdConfig()

            _isLoading.value = false
        }
    }

    fun loadTwitterUsers() {
        viewModelScope.launch {
            try {
                val response = apiService.getTwitterUsers()
                if (response.isSuccessful) {
                    response.body()?.data?.let {
                        _twitterUsers.value = it
                    }
                }
            } catch (e: Exception) {
                _error.value = "加载 Twitter 用户失败: ${e.message}"
            }
        }
    }

    fun loadXueqiuUsers() {
        viewModelScope.launch {
            try {
                val response = apiService.getXueqiuUsers()
                if (response.isSuccessful) {
                    response.body()?.data?.let {
                        _xueqiuUsers.value = it
                    }
                }
            } catch (e: Exception) {
                _error.value = "加载雪球用户失败: ${e.message}"
            }
        }
    }

    fun loadQueryIdConfig() {
        viewModelScope.launch {
            try {
                val response = apiService.getQueryIdConfig()
                if (response.isSuccessful) {
                    response.body()?.data?.let {
                        _queryIdConfig.value = it
                    }
                }
            } catch (e: Exception) {
                _error.value = "加载 Query ID 配置失败: ${e.message}"
            }
        }
    }

    fun addTwitterUser(userId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val user = MonitorUser(user_id = userId)
                val response = apiService.addTwitterUser(user)
                if (response.isSuccessful && response.body()?.success == true) {
                    _successMessage.value = "添加成功"
                    loadTwitterUsers()
                } else {
                    _error.value = response.body()?.error ?: "添加失败"
                }
            } catch (e: Exception) {
                _error.value = "添加失败: ${e.message}"
            }

            _isLoading.value = false
        }
    }

    fun addXueqiuUser(userId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val user = MonitorUser(user_id = userId)
                val response = apiService.addXueqiuUser(user)
                if (response.isSuccessful && response.body()?.success == true) {
                    _successMessage.value = "添加成功"
                    loadXueqiuUsers()
                } else {
                    _error.value = response.body()?.error ?: "添加失败"
                }
            } catch (e: Exception) {
                _error.value = "添加失败: ${e.message}"
            }

            _isLoading.value = false
        }
    }

    fun deleteTwitterUser(userId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val response = apiService.deleteTwitterUser(userId)
                if (response.isSuccessful && response.body()?.success == true) {
                    _successMessage.value = "删除成功"
                    loadTwitterUsers()
                } else {
                    _error.value = response.body()?.error ?: "删除失败"
                }
            } catch (e: Exception) {
                _error.value = "删除失败: ${e.message}"
            }

            _isLoading.value = false
        }
    }

    fun deleteXueqiuUser(userId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val response = apiService.deleteXueqiuUser(userId)
                if (response.isSuccessful && response.body()?.success == true) {
                    _successMessage.value = "删除成功"
                    loadXueqiuUsers()
                } else {
                    _error.value = response.body()?.error ?: "删除失败"
                }
            } catch (e: Exception) {
                _error.value = "删除失败: ${e.message}"
            }

            _isLoading.value = false
        }
    }

    fun updateQueryId(type: String, queryId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val request = QueryIdUpdateRequest(type, queryId)
                val response = apiService.updateQueryIdConfig(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    _successMessage.value = "更新成功"
                    response.body()?.data?.let {
                        _queryIdConfig.value = it
                    }
                } else {
                    _error.value = response.body()?.error ?: "更新失败"
                }
            } catch (e: Exception) {
                _error.value = "更新失败: ${e.message}"
            }

            _isLoading.value = false
        }
    }

    fun syncXueqiu() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val response = apiService.syncXueqiu()
                if (response.isSuccessful && response.body()?.success == true) {
                    _successMessage.value = "✅ 同步完成"
                    loadXueqiuUsers()
                } else {
                    _error.value = response.body()?.error ?: "同步失败"
                }
            } catch (e: Exception) {
                _error.value = "❌ 同步失败: ${e.message}"
            }

            _isLoading.value = false
        }
    }

    fun syncTwitter() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val response = apiService.syncTwitterUsers()
                if (response.isSuccessful && response.body()?.success == true) {
                    _successMessage.value = "✅ 同步完成"
                    loadTwitterUsers()
                } else {
                    _error.value = response.body()?.error ?: "同步失败"
                }
            } catch (e: Exception) {
                _error.value = "❌ 同步失败: ${e.message}"
            }

            _isLoading.value = false
        }
    }

    fun clearError() {
        _error.value = null
    }

    fun clearSuccessMessage() {
        _successMessage.value = null
    }
}
