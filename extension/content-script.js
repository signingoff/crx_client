/**
 * X For You - Content Script
 *
 * 功能：
 * 1. 检测是否在 iframe 中运行
 * 2. 隐藏 X.com 的 header、sidebar 等 UI 元素
 * 3. 响应来自父页面的 postMessage 通信
 * 4. 向父页面报告扩展已安装
 */

(function() {
  'use strict';

  // 防止重复注入
  if (window.__xForYouInjected) return;
  window.__xForYouInjected = true;

  const isInIframe = window.self !== window.top;

  /**
   * 创建并注入 CSS 样式
   */
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* 隐藏全局 header */
      header[role="banner"],
      [data-testid="primaryColumn"] > div:first-child,
      .css-1dbjc4n.r-1habvww,
      .css-1dbjc4n.r-1pi2tsx {
        display: none !important;
      }

      /* 隐藏侧边栏 */
      [data-testid="sidebarColumn"],
      .css-1dbjc4n.r-aqfbo4.r-1d2f490,
      aside[role="complementary"] {
        display: none !important;
      }

      /* 隐藏底部导航（移动端） */
      [data-testid="BottomBar"],
      nav[role="navigation"].css-1dbjc4n.r-1habvww {
        display: none !important;
      }

      /* 调整主内容区布局 */
      [data-testid="primaryColumn"] {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
      }

      /* 隐藏搜索框 */
      [data-testid="SearchBox"],
      [data-testid="searchBox"] {
        display: none !important;
      }

      /* 隐藏消息提示横幅 */
      .css-1dbjc4n.r-1awozwy.r-1kihuf0,
      [data-testid="toast"] {
        display: none !important;
      }

      /* 移除左右内边距 */
      .css-1dbjc4n.r-1ninfw3,
      .css-1dbjc4n.r-18u37iz {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      /* 隐藏 Premium 提示 */
      [data-testid="premium-upsell"],
      a[href*="premium"] {
        display: none !important;
      }

      /* 调整内容区域 */
      main[role="main"] {
        width: 100% !important;
      }

      /* 隐藏登录提示（如果未登录） */
      [data-testid="loginWall"],
      .css-1dbjc4n.r-1ninfw3.r-1x0uki6 {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 监听 DOM 变化，持续应用样式（SPA 页面切换时）
   */
  function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      // X.com 是 SPA，页面切换时重新应用样式
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 可以在这里添加额外的 DOM 操作
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 监听来自父页面的消息
   */
  function setupMessageListener() {
    window.addEventListener('message', (event) => {
      // 安全检查：验证消息来源
      // 注意：由于 iframe 和父页面不同源，我们无法直接验证 origin
      // 这里通过消息类型来区分

      const { type, data } = event.data || {};

      switch (type) {
        case 'PING_FROM_PAGE':
          // 响应父页面的 ping，报告扩展已安装
          window.parent.postMessage({
            type: 'PONG_FROM_EXTENSION',
            data: {
              version: '1.0.0',
              inIframe: isInIframe
            }
          }, '*');
          break;

        case 'HIDE_ELEMENT':
          // 根据选择器隐藏特定元素
          if (data?.selector) {
            const elements = document.querySelectorAll(data.selector);
            elements.forEach(el => {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
            });
          }
          break;

        case 'SCROLL_TO_TWEET':
          // 滚动到特定推文
          if (data?.tweetId) {
            const tweet = document.querySelector(`[data-tweet-id="${data.tweetId}"]`);
            if (tweet) {
              tweet.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
          break;

        case 'GET_PAGE_INFO':
          // 返回页面信息
          window.parent.postMessage({
            type: 'PAGE_INFO',
            data: {
              url: window.location.href,
              title: document.title,
              inIframe: isInIframe,
              readyState: document.readyState
            }
          }, '*');
          break;

        default:
          // 忽略未知消息类型
          break;
      }
    });
  }

  /**
   * 初始化
   */
  function init() {
    // 无论是否在 iframe 中，都响应 ping 消息（用于检测扩展是否安装）
    setupMessageListener();

    if (isInIframe) {
      // 只在 iframe 中执行 UI 隐藏逻辑
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          injectStyles();
          observeDOMChanges();
        });
      } else {
        injectStyles();
        observeDOMChanges();
      }
    }

    // 通知父页面扩展已就绪
    window.parent.postMessage({
      type: 'EXTENSION_READY',
      data: {
        inIframe: isInIframe,
        timestamp: Date.now()
      }
    }, '*');
  }

  // 启动
  init();
})();
