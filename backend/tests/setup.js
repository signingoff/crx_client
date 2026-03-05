// 测试环境设置
import { vi } from 'vitest';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.X_AUTH_TOKEN = 'test_auth_token';
process.env.X_CT0 = 'test_ct0';
process.env.X_BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
process.env.XUEQIU_COOKIE = 'test_xueqiu_cookie';

// 测试数据库配置 - 使用 SQLite
process.env.TEST_DB = 'sqlite';
process.env.DATABASE_URL = ':memory:';

// 模拟 console 方法，避免测试输出杂乱
const originalConsole = { ...console };
global.console = {
  ...console,
  log: vi.fn((...args) => {
    // 允许某些重要日志在测试中显示
    if (process.env.VITEST_DEBUG) {
      originalConsole.log(...args);
    }
  }),
  error: vi.fn((...args) => {
    if (process.env.VITEST_DEBUG) {
      originalConsole.error(...args);
    }
  }),
  warn: vi.fn((...args) => {
    if (process.env.VITEST_DEBUG) {
      originalConsole.warn(...args);
    }
  }),
  info: vi.fn()
};

// 全局测试工具函数
global.testUtils = {
  /**
   * 等待指定时间
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * 创建模拟的 Axios 响应
   */
  createAxiosResponse: (data, status = 200) => ({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {}
  }),

  /**
   * 创建模拟的 Axios 错误
   */
  createAxiosError: (message, status = 500, responseData = null) => {
    const error = new Error(message);
    error.response = {
      status,
      data: responseData || { error: message },
      headers: {}
    };
    error.config = {};
    return error;
  }
};

// 测试生命周期钩子
export function setup() {
  // 全局 setup
}

export function teardown() {
  // 全局 teardown
}
