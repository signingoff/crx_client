package com.xueqiu.xforyou.data.local

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthDataStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs: SharedPreferences = context.getSharedPreferences(AUTH_PREFS_NAME, Context.MODE_PRIVATE)

    var authToken: String?
        get() = prefs.getString(KEY_AUTH_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_AUTH_TOKEN, value).apply()

    fun clearToken() {
        prefs.edit().remove(KEY_AUTH_TOKEN).apply()
    }

    fun isLoggedIn(): Boolean {
        return !authToken.isNullOrEmpty()
    }

    companion object {
        private const val AUTH_PREFS_NAME = "x_foryou_auth"
        private const val KEY_AUTH_TOKEN = "auth_token"
    }
}
