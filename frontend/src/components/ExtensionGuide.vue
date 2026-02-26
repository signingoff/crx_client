<template>
  <div class="extension-guide">
    <div class="guide-card">
      <div class="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>

      <h2>需要安装浏览器扩展</h2>
      <p class="description">
        为了在 iframe 中正常显示 X.com 内容，需要安装 X For You 扩展来移除 X-Frame-Options 限制。
      </p>

      <div class="steps">
        <div class="step" :class="{ active: currentStep === 1 }">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>开启开发者模式</h4>
            <p>打开 Chrome，访问 <code>chrome://extensions/</code>，开启右上角「开发者模式」</p>
          </div>
        </div>

        <div class="step" :class="{ active: currentStep === 2 }">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>加载扩展</h4>
            <p>点击「加载已解压的扩展程序」，选择项目中的 <code>extension</code> 文件夹</p>
          </div>
        </div>

        <div class="step" :class="{ active: currentStep === 3 }">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>刷新页面</h4>
            <p>扩展安装完成后，点击下方按钮刷新页面</p>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn-refresh" @click="checkAndRefresh" :disabled="checking">
          <span v-if="checking" class="spinner"></span>
          <span v-else>🔄 检测扩展并刷新</span>
        </button>

        <button class="btn-skip" @click="$emit('skip')">
          暂不安装，使用基本功能
        </button>
      </div>

      <div v-if="status" class="status" :class="status.type">
        {{ status.message }}
      </div>
    </div>

    <div class="help-section">
      <h3>💡 为什么需要扩展？</h3>
      <ul>
        <li>X.com 默认禁止在 iframe 中嵌入（X-Frame-Options 限制）</li>
        <li>扩展移除该限制，允许在应用内查看推文详情</li>
        <li>同时自动隐藏 X.com 的 header、sidebar 等无关元素</li>
        <li>所有处理都在本地完成，不会上传任何数据</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { checkExtensionInstalled } from '../utils/extension.js'

const emit = defineEmits(['installed', 'skip'])

const currentStep = ref(1)
const checking = ref(false)
const status = ref(null)

async function checkAndRefresh() {
  checking.value = true
  status.value = { type: 'info', message: '正在检测扩展...' }

  const result = await checkExtensionInstalled()

  if (result.installed) {
    status.value = { type: 'success', message: `扩展已安装 (v${result.version})，正在刷新...` }
    setTimeout(() => {
      emit('installed')
    }, 500)
  } else {
    status.value = { type: 'error', message: '未检测到扩展，请确保已按步骤安装' }
    currentStep.value = 2
  }

  checking.value = false
}

onMounted(async () => {
  const result = await checkExtensionInstalled()
  if (result.installed) {
    emit('installed')
  }
})
</script>

<style scoped>
.extension-guide {
  height: 100%;
  padding: 40px;
  overflow-y: auto;
  background: #f7f9fa;
}

.guide-card {
  max-width: 600px;
  margin: 0 auto 30px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #1d9bf0 0%, #1a8cd8 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

h2 {
  text-align: center;
  font-size: 24px;
  color: #0f1419;
  margin-bottom: 12px;
}

.description {
  text-align: center;
  color: #536471;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 30px;
}

.steps {
  margin-bottom: 30px;
}

.step {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.step.active {
  background: #f7f9fa;
}

.step-number {
  width: 32px;
  height: 32px;
  background: #e1e8ed;
  color: #536471;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.step.active .step-number {
  background: #1d9bf0;
  color: white;
}

.step-content h4 {
  font-size: 15px;
  color: #0f1419;
  margin-bottom: 4px;
}

.step-content p {
  font-size: 13px;
  color: #536471;
  line-height: 1.5;
}

.step-content code {
  background: #eff3f4;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-refresh {
  padding: 14px 24px;
  background: #1d9bf0;
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-refresh:hover:not(:disabled) {
  background: #1a8cd8;
}

.btn-refresh:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-skip {
  padding: 12px 24px;
  background: transparent;
  color: #536471;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-skip:hover {
  color: #0f1419;
  text-decoration: underline;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.status.info {
  background: #e8f5fd;
  color: #1d9bf0;
}

.status.success {
  background: #e6f3e6;
  color: #17bf63;
}

.status.error {
  background: #ffebee;
  color: #e0245e;
}

.help-section {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.help-section h3 {
  font-size: 15px;
  color: #0f1419;
  margin-bottom: 12px;
}

.help-section ul {
  list-style: none;
  padding: 0;
}

.help-section li {
  font-size: 13px;
  color: #536471;
  line-height: 1.8;
  padding-left: 20px;
  position: relative;
}

.help-section li::before {
  content: '•';
  position: absolute;
  left: 6px;
  color: #1d9bf0;
}
</style>
