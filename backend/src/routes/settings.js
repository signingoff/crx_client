import { Router } from 'express';
import { getAllSettings, getSetting, setSetting } from '../db/index.js';

const router = Router();

// 敏感字段列表（返回时隐藏）
const SENSITIVE_KEYS = ['X_AUTH_TOKEN', 'X_CT0'];

/**
 * GET /api/settings
 * 获取所有设置
 */
router.get('/', async (req, res) => {
  try {
    const settings = await getAllSettings();

    // 隐藏敏感字段的值
    const maskedSettings = {};
    Object.keys(settings).forEach(key => {
      maskedSettings[key] = {
        ...settings[key],
        value: SENSITIVE_KEYS.includes(key)
          ? maskValue(settings[key].value)
          : settings[key].value
      };
    });

    res.json({
      success: true,
      data: maskedSettings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取设置失败'
    });
  }
});

/**
 * GET /api/settings/:key
 * 获取单个设置
 */
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await getSetting(key, '');

    res.json({
      success: true,
      data: {
        key,
        value: SENSITIVE_KEYS.includes(key) ? maskValue(value) : value
      }
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取设置失败'
    });
  }
});

/**
 * POST /api/settings/:key
 * 更新设置
 */
router.post('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少 value 参数'
      });
    }

    const success = await setSetting(key, value);

    if (success) {
      res.json({
        success: true,
        message: '设置已更新',
        data: {
          key,
          value: SENSITIVE_KEYS.includes(key) ? maskValue(value) : value
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: '更新设置失败'
      });
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      error: error.message || '更新设置失败'
    });
  }
});

/**
 * 隐藏敏感信息
 */
function maskValue(value) {
  if (!value || value.length < 8) return '***';
  return value.slice(0, 4) + '****' + value.slice(-4);
}

export default router;
