<template>
  <Teleport to="body">
    <div class="login-overlay" @click.self="handleCancel" @keydown.esc="handleCancel">
      <div class="login-modal">
        <button class="close-btn" @click="handleCancel" title="关闭">✕</button>
        <div class="modal-header">
          <h2>{{ isSetup ? '🔐 设置密码' : '🔐 登录' }}</h2>
          <p class="subtitle" v-if="isSetup">首次使用，请设置访问密码</p>
          <p class="subtitle" v-else>请输入密码以访问此功能</p>
        </div>

        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="input-group">
            <input
              ref="passwordInput"
              v-model="password"
              type="password"
              :placeholder="isSetup ? '输入新密码' : '输入密码'"
              class="password-input"
              autofocus
            />
          </div>

          <div v-if="isSetup" class="input-group">
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="确认密码"
              class="password-input"
            />
          </div>

          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

          <button
            type="submit"
            class="submit-btn"
            :disabled="submitting"
          >
            {{ submitting ? '处理中...' : (isSetup ? '设置密码' : '登录') }}
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { hasPassword, setPassword, login } from '../api/auth.js'

const emit = defineEmits(['success', 'cancel'])

const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const submitting = ref(false)
const isSetup = ref(false)
const passwordInput = ref(null)

onMounted(async () => {
  try {
    const has = await hasPassword()
    isSetup.value = !has
  } catch {
    isSetup.value = false
  }
  await nextTick()
  passwordInput.value?.focus()
})

async function handleSubmit() {
  errorMsg.value = ''
  const pwd = password.value.trim()

  if (!pwd) {
    errorMsg.value = '请输入密码'
    return
  }

  if (isSetup.value) {
    if (pwd.length < 4) {
      errorMsg.value = '密码至少4位'
      return
    }
    if (pwd !== confirmPassword.value.trim()) {
      errorMsg.value = '两次密码不一致'
      return
    }
  }

  submitting.value = true
  try {
    if (isSetup.value) {
      const res = await setPassword(pwd)
      if (res.success) {
        emit('success')
      } else {
        errorMsg.value = res.error || '设置失败'
      }
    } else {
      const res = await login(pwd)
      if (res.success) {
        emit('success')
      } else {
        errorMsg.value = res.error || '登录失败'
      }
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.error || err.message || '网络错误'
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.login-modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  width: 380px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: modalIn 0.25s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 18px;
  color: #536471;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e1e8ed;
  color: #0f1419;
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  color: #0f1419;
}

.subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #536471;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  width: 100%;
}

.password-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.password-input:focus {
  border-color: #1d9bf0;
}

.error-msg {
  color: #e0245e;
  font-size: 14px;
  text-align: center;
  padding: 8px;
  background: #fce4e4;
  border-radius: 8px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #1d9bf0;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  background: #1a8cd8;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
