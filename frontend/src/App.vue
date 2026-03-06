<template>
  <router-view />
  <LoginModal
    v-if="showLogin"
    @success="handleLoginSuccess"
    @cancel="handleLoginCancel"
  />
</template>

<script setup>
import { ref, provide } from 'vue'
import { useRouter } from 'vue-router'
import { verifyToken } from './api/auth.js'
import LoginModal from './components/LoginModal.vue'

const router = useRouter()

const showLogin = ref(false)
let loginResolve = null
let pendingRoute = null

/**
 * 检查是否已认证，未认证则弹出登录窗口
 * @returns {Promise<boolean>} 是否认证成功
 */
async function requireAuth() {
  const valid = await verifyToken()
  if (valid) return true

  return new Promise((resolve) => {
    loginResolve = resolve
    showLogin.value = true
  })
}

function handleLoginSuccess() {
  showLogin.value = false
  if (loginResolve) {
    loginResolve(true)
    loginResolve = null
  }
  // 如果有待跳转的路由
  if (pendingRoute) {
    const route = pendingRoute
    pendingRoute = null
    router.push(route)
  }
}

function handleLoginCancel() {
  showLogin.value = false
  if (loginResolve) {
    loginResolve(false)
    loginResolve = null
  }
  pendingRoute = null
}

// 路由守卫：保护需要认证的页面
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const valid = await verifyToken()
    if (!valid) {
      pendingRoute = to.fullPath
      showLogin.value = true
      loginResolve = null

      // 等待登录结果
      const result = await new Promise((resolve) => {
        loginResolve = resolve
      })

      if (result) {
        next()
      } else {
        next('/')
      }
      return
    }
  }
  next()
})

// 提供给子组件使用
provide('requireAuth', requireAuth)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: #f7f9fa;
}

#app {
  min-height: 100vh;
}

/* 浏览器窗口滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f7f9fa;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
