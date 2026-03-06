package com.xueqiu.xforyou.ui.home

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.xueqiu.xforyou.data.model.Tweet
import com.xueqiu.xforyou.data.repository.TweetRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: TweetRepository
) : ViewModel() {

    private val _tweets = mutableStateOf<List<Tweet>>(emptyList())
    val tweets: State<List<Tweet>> = _tweets

    private val _isLoading = mutableStateOf(false)
    val isLoading: State<Boolean> = _isLoading

    private val _isLoadingMore = mutableStateOf(false)
    val isLoadingMore: State<Boolean> = _isLoadingMore

    private val _error = mutableStateOf<String?>(null)
    val error: State<String?> = _error

    private val _hasMoreData = mutableStateOf(true)
    val hasMoreData: State<Boolean> = _hasMoreData

    private var refreshJob: Job? = null
    private var currentPage = 1
    private val pageSize = 20

    init {
        loadTweets()
        startAutoRefresh()
    }

    private fun startAutoRefresh() {
        refreshJob = viewModelScope.launch {
            while (true) {
                delay(8000) // 8秒刷新一次
                refresh()
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        refreshJob?.cancel()
    }

    fun loadTweets() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            currentPage = 1

            val twitterResult = repository.getTwitterPosts(page = 1, limit = pageSize)
            val xueqiuResult = repository.getXueqiuPosts(page = 1, limit = pageSize)

            val allTweets = mutableListOf<Tweet>()

            twitterResult.onSuccess { allTweets.addAll(it) }
            xueqiuResult.onSuccess { allTweets.addAll(it) }

            // 按时间排序
            _tweets.value = allTweets.sortedByDescending { it.createdAt }

            // 检查是否还有更多数据
            val twitterCount = twitterResult.getOrNull()?.size ?: 0
            val xueqiuCount = xueqiuResult.getOrNull()?.size ?: 0
            _hasMoreData.value = (twitterCount >= pageSize || xueqiuCount >= pageSize)

            if (twitterResult.isFailure && xueqiuResult.isFailure) {
                _error.value = "Failed to load tweets"
            }

            _isLoading.value = false
        }
    }

    fun loadMoreTweets() {
        if (_isLoadingMore.value || !_hasMoreData.value) return

        viewModelScope.launch {
            _isLoadingMore.value = true
            currentPage++

            val twitterResult = repository.getTwitterPosts(page = currentPage, limit = pageSize)
            val xueqiuResult = repository.getXueqiuPosts(page = currentPage, limit = pageSize)

            val newTweets = mutableListOf<Tweet>()

            twitterResult.onSuccess { newTweets.addAll(it) }
            xueqiuResult.onSuccess { newTweets.addAll(it) }

            // 检查是否还有更多数据
            val twitterCount = twitterResult.getOrNull()?.size ?: 0
            val xueqiuCount = xueqiuResult.getOrNull()?.size ?: 0
            _hasMoreData.value = (twitterCount >= pageSize || xueqiuCount >= pageSize)

            if (newTweets.isNotEmpty()) {
                // 合并并去重，按时间排序
                val combinedTweets = (_tweets.value + newTweets)
                    .distinctBy { it.id }
                    .sortedByDescending { it.createdAt }
                _tweets.value = combinedTweets
            } else {
                _hasMoreData.value = false
            }

            _isLoadingMore.value = false
        }
    }

    fun toggleTweetRead(tweet: Tweet) {
        viewModelScope.launch {
            val newReadState = !tweet.isRead
            val result = if (tweet.source == "twitter") {
                repository.markTwitterRead(tweet.id, newReadState)
            } else {
                repository.markXueqiuRead(tweet.id, newReadState)
            }

            result.onSuccess {
                // 更新本地状态
                _tweets.value = _tweets.value.map {
                    if (it.id == tweet.id) it.copy(isRead = newReadState) else it
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            val twitterResult = repository.getTwitterPosts(page = 1, limit = pageSize)
            val xueqiuResult = repository.getXueqiuPosts(page = 1, limit = pageSize)

            val newTweets = mutableListOf<Tweet>()

            twitterResult.onSuccess { newTweets.addAll(it) }
            xueqiuResult.onSuccess { newTweets.addAll(it) }

            if (newTweets.isNotEmpty()) {
                // 合并新数据，保持现有数据，去重后按时间排序
                val combinedTweets = (newTweets + _tweets.value)
                    .distinctBy { it.id }
                    .sortedByDescending { it.createdAt }
                _tweets.value = combinedTweets
            }
        }
    }

    fun clearError() {
        _error.value = null
    }
}
