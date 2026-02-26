// 这个脚本在 webview (x.com) 中执行，用于隐藏 UI
(function() {
  'use strict';

  // 只在 iframe/webview 中执行（非顶层窗口）
  if (window.self === window.top) return;

  // 隐藏 X.com 的 UI 元素
  function hideXUI() {
    const style = document.createElement('style');
    style.textContent = `
      /* 隐藏 Header */
      header[role="banner"],
      [data-testid="primaryColumn"] > div:first-child > div:first-child {
        display: none !important;
      }

      /* 隐藏 Sidebar */
      [data-testid="sidebarColumn"],
      [data-testid="BottomBar"] {
        display: none !important;
      }

      /* 调整主内容区宽度 */
      [data-testid="primaryColumn"] {
        width: 100% !important;
        max-width: 100% !important;
      }

      /* 移除侧边距 */
      .r-1ye8kvj,
      .r-1s2bzr4 {
        max-width: 100% !important;
      }

      /* 隐藏底部导航 */
      nav[role="navigation"][aria-label="Primary"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 页面加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideXUI);
  } else {
    hideXUI();
  }

  // 监听 DOM 变化（X.com 是 SPA）
  const observer = new MutationObserver((mutations) => {
    hideXUI();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 5秒后停止观察以提高性能
  setTimeout(() => {
    observer.disconnect();
  }, 5000);
})();
