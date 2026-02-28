import { Router } from 'express';

const router = Router();

// 从环境变量读取设置
const settings = {
  'HOME_TIMELINE_QUERY_ID': process.env.HOME_TIMELINE_QUERY_ID || '',
  'HOME_LATEST_TIMELINE_QUERY_ID': process.env.HOME_LATEST_TIMELINE_QUERY_ID || '',
  'X_AUTH_TOKEN': process.env.X_AUTH_TOKEN || '',
  'X_CT0': process.env.X_CT0 || '',
  'X_BEARER_TOKEN': process.env.X_BEARER_TOKEN || ''
};

// 敏感字段列表
const SENSITIVE_KEYS = ['X_AUTH_TOKEN', 'X_CT0'];

/**
 * GET /api/settings
 * 获取所有设置
 */
router.get('/', (req, res) => {
  const maskedSettings = {};
  Object.keys(settings).forEach(key => {
    const value = settings[key];
    maskedSettings[key] = {
      value: SENSITIVE_KEYS.includes(key) ? maskValue(value) : value,
      description: getDescription(key)
    };
  });

  res.json({
    success: true,
    data: maskedSettings
  });
});

/**
 * GET /api/settings/:key
 * 获取单个设置
 */
router.get('/:key', (req, res) => {
  const { key } = req.params;
  const value = settings[key] || '';

  res.json({
    success: true,
    data: {
      key,
      value: SENSITIVE_KEYS.includes(key) ? maskValue(value) : value
    }
  });
});

/**
 * POST /api/settings/:key
 * 更新设置（仅内存，不持久化）
 */
router.post('/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    return res.status(400).json({
      success: false,
      error: '缺少 value 参数'
    });
  }

  // 更新内存中的值
  settings[key] = value;

  res.json({
    success: true,
    message: '设置已更新（仅内存，重启后失效）',
    data: {
      key,
      value: SENSITIVE_KEYS.includes(key) ? maskValue(value) : value
    }
  });
});

function getDescription(key) {
  const descriptions = {
    'HOME_TIMELINE_QUERY_ID': 'HomeTimeline API Query ID',
    'HOME_LATEST_TIMELINE_QUERY_ID': 'HomeLatestTimeline API Query ID',
    'X_AUTH_TOKEN': 'X.com auth_token cookie',
    'X_CT0': 'X.com ct0 cookie (CSRF token)',
    'X_BEARER_TOKEN': 'X.com API Bearer Token'
  };
  return descriptions[key] || '';
}

function maskValue(value) {
  if (!value || value.length < 8) return '***';
  return value.slice(0, 4) + '****' + value.slice(-4);
}

export default router;
