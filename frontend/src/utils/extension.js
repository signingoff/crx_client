/**
 * 扩展检测和通信工具
 */

const PING_TIMEOUT = 500

/**
 * 检测 X For You 扩展是否已安装
 * @returns {Promise<{installed: boolean, version?: string}>}
 */
export function checkExtensionInstalled() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ installed: false })
    }, PING_TIMEOUT)

    const handler = (e) => {
      if (e.data?.type === 'PONG_FROM_EXTENSION') {
        clearTimeout(timeout)
        window.removeEventListener('message', handler)
        resolve({
          installed: true,
          version: e.data.data?.version
        })
      }
    }

    window.addEventListener('message', handler)
    window.postMessage({ type: 'PING_FROM_PAGE' }, '*')
  })
}

/**
 * 等待扩展就绪
 * @param {number} maxWaitMs - 最大等待时间
 * @returns {Promise<boolean>}
 */
export function waitForExtension(maxWaitMs = 2000) {
  return new Promise((resolve) => {
    const startTime = Date.now()

    const check = async () => {
      const result = await checkExtensionInstalled()
      if (result.installed) {
        resolve(true)
        return
      }

      if (Date.now() - startTime >= maxWaitMs) {
        resolve(false)
        return
      }

      setTimeout(check, 100)
    }

    check()
  })
}

/**
 * 向 iframe 内的 X.com 发送消息
 * @param {HTMLIFrameElement} iframe
 * @param {string} type - 消息类型
 * @param {any} data - 消息数据
 */
export function sendToIframe(iframe, type, data = null) {
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({ type, data }, '*')
  }
}

/**
 * 请求 iframe 页面信息
 * @param {HTMLIFrameElement} iframe
 * @returns {Promise<any>}
 */
export function getIframePageInfo(iframe) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(null)
    }, 1000)

    const handler = (e) => {
      if (e.data?.type === 'PAGE_INFO') {
        clearTimeout(timeout)
        window.removeEventListener('message', handler)
        resolve(e.data.data)
      }
    }

    window.addEventListener('message', handler)
    sendToIframe(iframe, 'GET_PAGE_INFO')
  })
}
