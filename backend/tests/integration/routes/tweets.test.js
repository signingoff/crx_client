import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock services before importing routes
vi.mock('../../../src/services/xService.js', () => ({
  getFollowingTweets: vi.fn(),
  getUserTweets: vi.fn(),
  getUserByScreenName: vi.fn()
}));

vi.mock('../../../src/config/settingsConfig.js', () => ({
  getConfig: vi.fn(() => ({
    homeLatestTimelineQueryId: 'test_latest_id',
    userTweetsQueryId: 'test_user_id',
    userByScreenNameQueryId: 'test_screen_name_id',
    updatedAt: '2024-01-01T00:00:00.000Z'
  })),
  loadConfigFromDB: vi.fn(() => Promise.resolve())
}));

vi.mock('../../../src/services/queryIdFetcher.js', () => ({
  fetchQueryIdsFromX: vi.fn(() => Promise.resolve({
    success: true,
    homeLatestTimelineQueryId: 'fetched_latest_id',
    userTweetsQueryId: 'fetched_user_id',
    userByScreenNameQueryId: 'fetched_screen_name_id'
  }))
}));

describe('Tweets Routes Integration Tests', () => {
  let app;
  let server;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const twitterQueryConfigRouter = (await import('../../../src/routes/twitterQueryConfig.js')).default;
    app.use('/api/tweets', twitterQueryConfigRouter);
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  describe('GET /api/tweets/config', () => {
    it('should return current config', async () => {
      const response = await request(app)
        .get('/api/tweets/config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('homeLatestTimelineQueryId');
      expect(response.body.data).toHaveProperty('userTweetsQueryId');
      expect(response.body.data).toHaveProperty('userByScreenNameQueryId');
      expect(response.body.data).toHaveProperty('updatedAt');
    });
  });

  describe('POST /api/tweets/config/query-id', () => {
    it('should update query ID', async () => {
      const response = await request(app)
        .post('/api/tweets/config/query-id')
        .send({ type: 'following', queryId: 'new_query_id' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('已更新');
    });

    it('should validate type parameter', async () => {
      const response = await request(app)
        .post('/api/tweets/config/query-id')
        .send({ type: 'invalid', queryId: 'some_id' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('无效的类型');
    });

    it('should require queryId', async () => {
      const response = await request(app)
        .post('/api/tweets/config/query-id')
        .send({ type: 'following' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tweets/config/fetch-query-id', () => {
    it('should fetch and update query IDs from X', async () => {
      const { fetchQueryIdsFromX } = await import('../../../src/services/queryIdFetcher.js');
      fetchQueryIdsFromX.mockResolvedValueOnce({
        success: true,
        homeLatestTimelineQueryId: 'fetched_latest_id',
        userTweetsQueryId: 'fetched_user_id',
        userByScreenNameQueryId: 'fetched_screen_name_id'
      });

      const response = await request(app)
        .post('/api/tweets/config/fetch-query-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('自动获取并更新成功');
    });

    it('should handle fetch errors', async () => {
      const { fetchQueryIdsFromX } = await import('../../../src/services/queryIdFetcher.js');
      fetchQueryIdsFromX.mockResolvedValueOnce({
        success: false,
        error: 'Cookie expired'
      });

      const response = await request(app)
        .post('/api/tweets/config/fetch-query-id')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cookie expired');
    });
  });
});
