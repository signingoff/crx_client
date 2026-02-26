// 检测是否在 iframe 中
function isInIframe() {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

// 隐藏 X.com header
function hideHeader() {
  if (!isInIframe()) return

  const style = document.createElement('style')
  style.textContent = `
    /* 隐藏顶部导航栏 */
    header[role="banner"],
    [data-testid="primaryColumn"] > div:first-child,
    .css-175oi2r.r-1g40b8q.r-obd0qt.r-16y2uox,
    .css-175oi2r.r-lrvibr.r-1g40b8q.r-obd0qt.r-16y2uox {
      display: none !important;
    }

    /* 调整主内容区域 */
    .css-175oi2r.r-1pi2tsx.r-1rnoaur,
    .css-175oi2r.r-1pi2tsx.r-13qz1uu,
    main[role="main"] {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }

    /* 隐藏侧边栏 */
    .css-175oi2r.r-aqfbo4.r-1pi2tsx,
    .css-175oi2r.r-1xcajam.r-ipm5af {
      display: none !important;
    }

    /* 最大化内容区域 */
    .css-175oi2r.r-1pi2tsx.r-13qz1uu.r-1rnoaur {
      max-width: 100% !important;
      width: 100% !important;
    }
  `
  document.head.appendChild(style)
}

// 立即执行
hideHeader()

// 由于 X.com 是 SPA，需要监听 DOM 变化
const observer = new MutationObserver(() => {
  hideHeader()
})

// 在 DOM 加载完成后开始观察
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    hideHeader()
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  })
} else {
  hideHeader()
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}
