<template>
  <div class="settings-overlay" @click.self="close">
    <div class="settings-modal">
      <div class="settings-header">
        <h3>⚙️ 设置</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="settings-body">
        <div class="section">
          <h4>Query ID 配置</h4>



          <div class="manual-section">
            <div class="input-group">
              <label>Following Query ID:</label>
              <input
                v-model="manualFollowingQueryId"
                type="text"
                placeholder="输入 Query ID..."
              />
            </div>
            <div class="input-group">
              <label>User Tweets Query ID:</label>
              <input
                v-model="manualUserTweetsQueryId"
                type="text"
                placeholder="输入 Query ID..."
              />
            </div>
            <div class="input-group">
              <label>UserByScreenName Query ID:</label>
              <input
                v-model="manualUserByScreenNameQueryId"
                type="text"
                placeholder="输入 Query ID（访问用户主页时从 Network 抓取）..."
              />
            </div>
            <button
              class="btn btn-secondary"
              @click="manualUpdate"
              :disabled="!canManualUpdate"
            >
              💾 保存手动设置
            </button>
          </div>

          <div class="help-section">
            <h5>💡 如何手动获取 Query ID?</h5>
            <ol>
              <li>打开 <a href="https://x.com" target="_blank">x.com</a> 并登录</li>
              <li>按 F12 打开开发者工具 → Network 标签</li>
              <li>刷新页面，过滤 "HomeLatestTimeline"</li>
              <li>找到请求的 URL: <code>graphql/QUERY_ID/HomeLatestTimeline</code></li>
              <li>复制 QUERY_ID (22位字符串)</li>
            </ol>
          </div>

          <div v-if="message" :class="['message', messageType]">
            {{ message }}
          </div>
        </div>


      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getQueryConfig, updateQueryId } from '../api/tweets.js'

const emit = defineEmits(['close', 'updated'])

const config = ref(null)
const message = ref('')
const messageType = ref('info')
const manualFollowingQueryId = ref('')
const manualUserTweetsQueryId = ref('')
const manualUserByScreenNameQueryId = ref('')

const canManualUpdate = computed(() => {
  return manualFollowingQueryId.value.trim() || manualUserTweetsQueryId.value.trim() || manualUserByScreenNameQueryId.value.trim()
})

onMounted(async () => {
  await loadConfig()
})


async function loadConfig() {
  try {
    const response = await getQueryConfig()
    if (response.success) {
      config.value = response.data
      manualFollowingQueryId.value = response.data.homeLatestTimelineQueryId || ''
      manualUserTweetsQueryId.value = response.data.userTweetsQueryId || ''
      manualUserByScreenNameQueryId.value = response.data.userByScreenNameQueryId || ''
    }
  } catch (err) {
    showMessage('加载配置失败: ' + err.message, 'error')
  }
}

async function manualUpdate() {
  try {
    if (manualFollowingQueryId.value.trim()) {
      await updateQueryId('following', manualFollowingQueryId.value.trim())
    }
    if (manualUserTweetsQueryId.value.trim()) {
      await updateQueryId('user', manualUserTweetsQueryId.value.trim())
    }
    if (manualUserByScreenNameQueryId.value.trim()) {
      await updateQueryId('userByScreenName', manualUserByScreenNameQueryId.value.trim())
    }

    await loadConfig()
    showMessage('✅ 手动更新成功！', 'success')
    emit('updated')
  } catch (err) {
    showMessage('❌ 更新失败: ' + err.message, 'error')
  }
}

function showMessage(text, type = 'info') {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

function close() {
  emit('close')
}

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.settings-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e8ed;
}

.settings-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #536471;
  padding: 4px 8px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #e1e8ed;
}

.settings-body {
  padding: 15px;
  overflow-y: auto;
  max-height: calc(90vh - 60px);
}

.section h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #0f1419;
}

.description {
  color: #536471;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.current-config {
  background: #f7f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e1e8ed;
}

.config-item:last-child {
  border-bottom: none;
}

.config-item label {
  font-size: 13px;
  color: #536471;
  font-weight: 500;
}

.config-item code {
  background: #e1e8ed;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  color: #0f1419;
}

.config-item .time {
  font-size: 13px;
  color: #536471;
}

.actions {
  margin-bottom: 20px;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #1d9bf0;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1a8cd8;
}

.btn-secondary {
  background: #e1e8ed;
  color: #0f1419;
}

.btn-secondary:hover:not(:disabled) {
  background: #d1d9dd;
}


.manual-section {
  border-top: 1px solid #e1e8ed;
  padding-top: 16px;
  margin-bottom: 20px;
}

.manual-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #536471;
}

.input-group {
  margin-bottom: 12px;
}

.input-group label {
  display: block;
  font-size: 13px;
  color: #536471;
  margin-bottom: 4px;
}

.input-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cfd9de;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: #1d9bf0;
}

.help-section {
  background: #f7f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.help-section h5 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #536471;
}

.help-section ol {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #536471;
  line-height: 1.6;
}

.help-section li {
  margin-bottom: 4px;
}

.help-section a {
  color: #1d9bf0;
  text-decoration: none;
}

.help-section a:hover {
  text-decoration: underline;
}

.help-section code {
  background: #e1e8ed;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.message {
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.message.success {
  background: #d4edda;
  color: #155724;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
}

.message.info {
  background: #d1ecf1;
  color: #0c5460;
}

</style>
