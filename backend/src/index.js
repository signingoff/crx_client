import express from 'express';
import cors from 'cors';
import { startXueqiuSync } from './services/xueqiuSync.js';
import { startTwitterSync } from './services/twitterSync.js';

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

// 动态加载路由
const twitterQueryConfigRouter = (await import('./routes/twitterQueryConfig.js')).default;
app.use('/api/tweets', twitterQueryConfigRouter);

// 雪球网路由
const xueqiuRouter = (await import('./routes/xueqiu.js')).default;
app.use('/api/xueqiu', xueqiuRouter);

// Twitter 路由
const twitterRouter = (await import('./routes/twitter.js')).default;
app.use('/api/twitter', twitterRouter);

// 启动雪球帖子同步任务
startXueqiuSync(300000); // 每 5 分钟同步一次

// 启动 Twitter 同步任务
startTwitterSync(120000); // 每 2 分钟同步一次（Following + 监控用户）

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'X For You API Server',
    endpoints: {
      'GET /api/tweets/config': '获取 Query ID 配置',
      'GET /api/twitter/posts': '获取 Twitter 推文',
      'GET /api/xueqiu/posts': '获取雪球帖子'
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
