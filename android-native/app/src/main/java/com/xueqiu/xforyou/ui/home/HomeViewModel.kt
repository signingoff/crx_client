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

    private val _error = mutableStateOf<String?>(null)
    val error: State<String?> = _error

    private var refreshJob: Job? = null

    init {
        loadTweets()
        startAutoRefresh()
    }

    private fun startAutoRefresh() {
        refreshJob = viewModelScope.launch {
            while (true) {
                delay(8000) // 8秒刷新一次
                loadTweets()
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

            val twitterResult = repository.getTwitterPosts()
            val xueqiuResult = repository.getXueqiuPosts()

            val allTweets = mutableListOf<Tweet>()

            twitterResult.onSuccess { allTweets.addAll(it) }
            xueqiuResult.onSuccess { allTweets.addAll(it) }

            // 按时间排序
            _tweets.value = allTweets.sortedByDescending { it.createdAt }

            if (twitterResult.isFailure && xueqiuResult.isFailure) {
                _error.value = "Failed to load tweets"
            }

            _isLoading.value = false
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
        loadTweets()
    }

    fun clearError() {
        _error.value = null
    }
}
