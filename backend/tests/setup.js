// 测试环境设置
import { vi } from 'vitest'

// 模拟环境变量
process.env.PORT = '3001'
process.env.CORS_ORIGIN = 'http://localhost:5173'
process.env.X_AUTH_TOKEN = 'test_auth_token'
process.env.X_CT0 = 'test_ct0'
process.env.X_BEARER_TOKEN = 'test_bearer_token'

// 模拟 console 方法，避免测试输出杂乱
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}
