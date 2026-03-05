import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import twitterQueryConfigRouter from '../src/routes/twitterQueryConfig.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// 推文路由
app.use('/api/tweets', twitterQueryConfigRouter);

// Vercel Serverless Function 导出
export default app;
