import { Router } from 'express';
import crypto from 'crypto';
import { getSetting, setSetting } from '../db/index.js';

const router = Router();

// AES-256-CBC 加密配置
const ALGORITHM = 'aes-256-cbc';
const ENCRYPT_KEY = process.env.AUTH_ENCRYPT_KEY
  ? Buffer.from(process.env.AUTH_ENCRYPT_KEY, 'hex')
  : crypto.scryptSync('x-for-you-default-key', 'salt', 32);

const PASSWORD_SETTING_KEY = 'AUTH_PASSWORD';

// 内存中的 session 存储
const sessions = new Map();
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

/**
 * AES-256-CBC 加密
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPT_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 解密
 */
function decrypt(encryptedText) {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPT_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * 生成 session token
 */
function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY
  });
  return token;
}

/**
 * 清理过期 session
 */
function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now > session.expiresAt) {
      sessions.delete(token);
    }
  }
}

// 每小时清理一次过期 session
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

/**
 * GET /api/auth/has-password
 * 检查是否已设置密码
 */
router.get('/has-password', async (req, res) => {
  try {
    const stored = await getSetting(PASSWORD_SETTING_KEY, '');
    res.json({ success: true, hasPassword: !!stored });
  } catch (err) {
    console.error('检查密码状态失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/set-password
 * 首次设置密码（仅当数据库中无密码时允许）
 * Body: { password: string }
 */
router.post('/set-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: '密码至少4位' });
    }

    // 检查是否已有密码
    const existing = await getSetting(PASSWORD_SETTING_KEY, '');
    if (existing) {
      return res.status(403).json({ success: false, error: '密码已存在，无法重新设置' });
    }

    const encrypted = encrypt(password);
    await setSetting(PASSWORD_SETTING_KEY, encrypted);

    // 自动登录
    const token = createSession();
    res.json({ success: true, token });
  } catch (err) {
    console.error('设置密码失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/login
 * 验证密码
 * Body: { password: string }
 */
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: '请输入密码' });
    }

    const stored = await getSetting(PASSWORD_SETTING_KEY, '');
    if (!stored) {
      return res.status(400).json({ success: false, error: '尚未设置密码' });
    }

    const decrypted = decrypt(stored);
    if (password !== decrypted) {
      return res.status(401).json({ success: false, error: '密码错误' });
    }

    const token = createSession();
    res.json({ success: true, token });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/verify
 * 验证 token 是否有效
 * Body: { token: string }
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.json({ success: true, valid: false });
    }

    const session = sessions.get(token);
    if (!session || Date.now() > session.expiresAt) {
      sessions.delete(token);
      return res.json({ success: true, valid: false });
    }

    res.json({ success: true, valid: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
