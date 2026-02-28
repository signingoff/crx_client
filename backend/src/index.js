import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tweetsRouter from './routes/tweets.js';
import { validateCookies } from './config/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
// 允许所有来源（Render 前端可能有不同域名）
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
app.use(cors({
  origin: function(origin, callback) {
    // 允许没有 origin 的请求（如移动应用、Postman）
    if (!origin) return callback(null, true);
    // 允许本地开发和 Render 域名
    if (allowedOrigins.includes(origin) || origin.includes('onrender.com') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    callback(null, true); // 暂时允许所有来源
  },
  credentials: true
}));

app.use(express.json());

// 验证 cookies（可选，仅记录警告）
try {
  validateCookies();
} catch (err) {
  console.warn('⚠️ Cookie 验证警告:', err.message);
}

// 路由
app.use('/api/tweets', tweetsRouter);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'X For You API Server',
    endpoints: {
      'GET /api/tweets/for-you?count=20': '获取 For You 页面推文',
      'GET /api/tweets/health': '健康检查'
    }
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Try: http://localhost:${PORT}/api/tweets/for-you`);
});
