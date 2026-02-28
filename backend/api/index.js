import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tweetsRouter from '../src/routes/tweets.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// 推文路由
app.use('/api/tweets', tweetsRouter);

// Vercel Serverless Function 导出
export default app;
