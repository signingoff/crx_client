<template>
  <div class="xueqiu-settings">
    <header class="header">
      <div class="header-left">
        <router-link to="/" class="back-btn">← 返回</router-link>
        <h1>👥 用户管理</h1>
      </div>
    </header>

    <div class="content">
      <div class="panels">
      <!-- 左：雪球 -->
      <div class="panel">
      <!-- 添加用户 -->
      <div class="add-section">
        <h3>添加监控用户</h3>
        <div class="add-form">
          <input
            v-model="newUserId"
            type="text"
            placeholder="输入雪球用户ID（仅数字，如 7433300125）..."
            @keyup.enter="addUser"
            class="user-input"
          />
          <button class="btn-add" @click="addUser" :disabled="!newUserId.trim() || !isValidId">
            ➕ 添加
          </button>
        </div>
        <p class="help-text">
          💡 打开雪球用户主页，如 <a href="https://xueqiu.com/u/7433300125" target="_blank">xueqiu.com/u/7433300125</a>，URL 中的数字即为用户ID
        </p>
      </div>

      <!-- 用户表格 -->
      <div class="table-section">
        <h3>监控用户列表 ({{ userList.length }} 个)</h3>
        <div class="table-wrapper">
          <table class="user-table">
            <thead>
              <tr>
                <th>用户ID</th>
                <th>用户名</th>
                <th>帖子数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in userList" :key="user.user_id">
                <td class="user-id">{{ user.user_id }}</td>
                <td class="user-name">
                  <span v-if="user.loading" class="loading">加载中...</span>
                  <span v-else>{{ user.screen_name || user.name || '-' }}</span>
                </td>
                <td class="post-count">{{ user.postCount || 0 }}</td>
                <td class="actions">
                  <button class="btn-remove" @click="removeUser(user.user_id)" title="删除">
                    🗑️ 删除
                  </button>
                </td>
              </tr>
              <tr v-if="userList.length === 0">
                <td colspan="4" class="empty">暂无监控用户，请在上方添加</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 同步控制 -->
      <div class="sync-section">
        <div class="sync-info">
          <span class="status" :class="syncing ? 'syncing' : 'idle'">
            {{ syncing ? '🔄 同步中...' : '✓ 等待同步' }}
          </span>
          <span class="interval">每 5 分钟自动同步</span>
        </div>
        <button class="btn-sync" @click="triggerSync" :disabled="syncing">
          🔄 立即同步
        </button>
      </div>

      </div><!-- /panel left -->

      <!-- 右：Twitter -->
      <div class="panel">
      <!-- Twitter 用户监控 -->
      <div class="add-section">
        <h3>🐦 Twitter 用户监控</h3>
        <div class="add-form">
          <input
            v-model="newTwitterUserId"
            type="text"
            placeholder="输入 Twitter 用户的数字 ID（如 44196397）..."
            @keyup.enter="addTwitterUser"
            class="user-input"
          />
          <button class="btn-add" @click="addTwitterUser" :disabled="!newTwitterUserId.trim()">
            ➕ 添加
          </button>
        </div>
        <p class="help-text">
          💡 在 X.com 上打开用户主页，通过第三方工具（如 <a href="https://tweeterid.com" target="_blank">tweeterid.com</a>）查询用户数字 ID
        </p>
      </div>

      <div class="table-section">
        <h3>Twitter 监控用户列表 ({{ twitterUserList.length }} 个)</h3>
        <div class="table-wrapper">
          <table class="user-table">
            <thead>
              <tr>
                <th>用户ID</th>
                <th>用户名</th>
                <th>Bio</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in twitterUserList" :key="user.user_id">
                <td class="user-id">{{ user.user_id }}</td>
                <td class="user-name">{{ user.screen_name || '-' }}</td>
                <td class="user-desc">{{ user.description || '-' }}</td>
                <td class="actions">
                  <button class="btn-remove" @click="removeTwitterUser(user.user_id)">
                    🗑️ 删除
                  </button>
                </td>
              </tr>
              <tr v-if="twitterUserList.length === 0">
                <td colspan="4" class="empty">暂无监控用户</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="sync-section">
        <div class="sync-info">
          <span class="status" :class="twitterSyncing ? 'syncing' : 'idle'">
            {{ twitterSyncing ? '🔄 同步中...' : '✓ 等待同步' }}
          </span>
          <span class="interval">每 5 分钟自动同步</span>
        </div>
        <button class="btn-sync" @click="triggerTwitterUserSync" :disabled="twitterSyncing">
          🔄 立即同步
        </button>
      </div>

      </div><!-- /panel right -->
      </div><!-- /panels -->

      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API_BASE = '/api'

const userList = ref([]) // [{id, user_id, screen_name, name, postCount, loading}]
const newUserId = ref('')
const message = ref('')
const messageType = ref('info')
const syncing = ref(false)

const twitterUserList = ref([])
const newTwitterUserId = ref('')
const twitterSyncing = ref(false)

// 仅允许数字
const isValidId = computed(() => {
  const id = newUserId.value.trim()
  if (!id) return false
  return /^\d+$/.test(id)
})

onMounted(async () => {
  await loadUsers()
  await loadTwitterUsers()
})

async function loadUsers() {
  try {
    // 从新 API 获取用户列表（已包含帖子数）
    const res = await axios.get(`${API_BASE}/xueqiu/users`)
    if (res.data.success && res.data.data) {
      userList.value = res.data.data
      return
    }

    userList.value = []
  } catch (err) {
    console.log('加载用户失败:', err.message)
    userList.value = []
  }
}

async function addUser() {
  if (!newUserId.value.trim() || !isValidId.value) return

  const newId = newUserId.value.trim()
  if (userList.value.find(u => u.id === newId || u.user_id?.toString() === newId)) {
    showMessage('⚠️ 用户已存在', 'error')
    return
  }

  try {
    // 直接添加用户ID，后台会自动更新用户信息
    await axios.post(`${API_BASE}/xueqiu/users`, {
      user_id: newId,
      screen_name: ''
    })

    // 立即显示在列表中（用户名会后台更新后显示）
    userList.value.push({
      user_id: parseInt(newId),
      screen_name: '',
      postCount: 0,
      loading: false
    })

    showMessage('✅ 添加成功，后台正在同步...', 'success')
    newUserId.value = ''
  } catch (err) {
    showMessage('❌ 添加失败: ' + err.message, 'error')
  }
}

async function removeUser(id) {
  try {
    await axios.delete(`${API_BASE}/xueqiu/users/${id}`)

    // 从列表中移除该用户
    const idStr = String(id)
    userList.value = userList.value.filter(u => String(u.user_id) !== idStr)
    showMessage('✅ 已删除', 'success')
  } catch (err) {
    showMessage('❌ 删除失败: ' + err.message, 'error')
  }
}

async function triggerSync() {
  syncing.value = true
  try {
    await axios.get(`${API_BASE}/xueqiu/sync`)
    showMessage('✅ 同步完成', 'success')
    // 一次性刷新用户列表（含最新帖子数）
    await loadUsers()
  } catch (err) {
    showMessage('❌ 同步失败: ' + err.message, 'error')
  } finally {
    syncing.value = false
  }
}

async function loadTwitterUsers() {
  try {
    const res = await axios.get(`${API_BASE}/twitter/users`)
    if (res.data.success) {
      twitterUserList.value = res.data.data || []
    }
  } catch (err) {
    console.log('加载 Twitter 用户失败:', err.message)
  }
}

async function addTwitterUser() {
  const id = newTwitterUserId.value.trim()
  if (!id) return
  if (twitterUserList.value.find(u => u.user_id === id)) {
    showMessage('⚠️ 用户已存在', 'error')
    return
  }
  try {
    await axios.post(`${API_BASE}/twitter/users`, { user_id: id })
    twitterUserList.value.push({ user_id: id, screen_name: '', description: '' })
    showMessage('✅ 添加成功，后台正在同步...', 'success')
    newTwitterUserId.value = ''
  } catch (err) {
    showMessage('❌ 添加失败: ' + err.message, 'error')
  }
}

async function removeTwitterUser(userId) {
  try {
    await axios.delete(`${API_BASE}/twitter/users/${userId}`)
    twitterUserList.value = twitterUserList.value.filter(u => u.user_id !== userId)
    showMessage('✅ 已删除', 'success')
  } catch (err) {
    showMessage('❌ 删除失败: ' + err.message, 'error')
  }
}

async function triggerTwitterUserSync() {
  twitterSyncing.value = true
  try {
    await axios.post(`${API_BASE}/twitter/users/sync`)
    showMessage('✅ 同步完成', 'success')
    await loadTwitterUsers()
  } catch (err) {
    showMessage('❌ 同步失败: ' + err.message, 'error')
  } finally {
    twitterSyncing.value = false
  }
}

function showMessage(msg, type) {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}
</script>

<style scoped>
.xueqiu-settings {
  min-height: 100vh;
  background: #f7f9fa;
}

.header {
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e8ed;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  text-decoration: none;
  color: #1d9bf0;
  font-size: 14px;
}

.back-btn:hover {
  text-decoration: underline;
}

h1 {
  margin: 0;
  font-size: 20px;
  color: #0f1419;
}

.content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.panels {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.panel {
  flex: 1;
  min-width: 0;
}

.add-section, .table-section, .sync-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #0f1419;
}

.add-form {
  display: flex;
  gap: 8px;
}

.user-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #cfd9de;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.user-input:focus {
  border-color: #1d9bf0;
}

.btn-add {
  padding: 12px 24px;
  background: #1d9bf0;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-add:hover:not(:disabled) {
  background: #1a8cd8;
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.help-text {
  margin: 12px 0 0 0;
  font-size: 13px;
  color: #536471;
}

.help-text a {
  color: #1d9bf0;
}

.table-wrapper {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th {
  background: #f7f9fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #536471;
  position: sticky;
  top: 0;
}

.user-table td {
  padding: 12px 16px;
  border-top: 1px solid #e1e8ed;
  font-size: 14px;
}

.user-table .user-id {
  font-family: monospace;
  color: #0f1419;
}

.user-table .user-name {
  color: #0f1419;
}

.user-table .user-name .loading {
  color: #536471;
  font-style: italic;
}

.user-table .post-count {
  color: #536471;
}

.user-table .user-desc {
  color: #536471;
  font-size: 13px;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-table .actions {
  text-align: right;
}

.btn-remove {
  padding: 6px 12px;
  background: #fce4e4;
  color: #e0245e;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.btn-remove:hover {
  background: #e0245e;
  color: white;
}

.user-table .empty {
  text-align: center;
  color: #536471;
  padding: 40px 16px;
}

.sync-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status {
  font-size: 14px;
}

.status.idle {
  color: #00b075;
}

.status.syncing {
  color: #f59e0b;
}

.interval {
  font-size: 13px;
  color: #536471;
}

.btn-sync {
  padding: 10px 20px;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-sync:hover:not(:disabled) {
  background: #138496;
}

.btn-sync:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
}

.message.success {
  background: #e8f5e9;
  color: #00b075;
}

.message.error {
  background: #fce4e4;
  color: #e0245e;
}
</style>
