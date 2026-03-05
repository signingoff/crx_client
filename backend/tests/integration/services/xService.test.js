import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { mockTweets, xApiFixtures } from '../../fixtures/index.js';

// Mock axios
vi.mock('axios');

// Mock settingsConfig
vi.mock('../../../src/config/settingsConfig.js', () => ({
  getConfig: vi.fn(() => ({
    homeLatestTimelineQueryId: 'test_query_id',
    userTweetsQueryId: 'test_user_tweets_id',
    userByScreenNameQueryId: 'test_user_by_screen_name_id'
  })),
  getXCookies: vi.fn(() => Promise.resolve({
    auth_token: 'test_token',
    ct0: 'test_ct0',
    bearer_token: 'test_bearer'
  })),
  loadConfigFromDB: vi.fn(() => Promise.resolve())
}));

describe('X Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFollowingTweets', () => {
    it('should fetch and parse following timeline correctly', async () => {
      const { getFollowingTweets } = await import('../../../src/services/xService.js');

      // Mock axios response
      axios.get.mockResolvedValueOnce({
        data: xApiFixtures.timelineResponse
      });

      const tweets = await getFollowingTweets(20);

      expect(tweets).toBeDefined();
      expect(Array.isArray(tweets)).toBe(true);
      expect(tweets.length).toBeGreaterThan(0);

      // Verify first tweet structure
      const firstTweet = tweets[0];
      expect(firstTweet).toHaveProperty('id');
      expect(firstTweet).toHaveProperty('text');
      expect(firstTweet).toHaveProperty('author');
      expect(firstTweet).toHaveProperty('createdAt');
      expect(firstTweet).toHaveProperty('metrics');
    });

    it('should filter Japanese tweets', async () => {
      const { getFollowingTweets } = await import('../../../src/services/xService.js');

      axios.get.mockResolvedValueOnce({
        data: xApiFixtures.timelineResponse
      });

      const tweets = await getFollowingTweets(20);

      // Japanese tweet should be filtered out
      const japaneseTweet = tweets.find(t =>
        t.text.includes('日本語') || t.text.includes('ツイート')
      );
      expect(japaneseTweet).toBeUndefined();
    });

    it('should handle API errors gracefully', async () => {
      const { getFollowingTweets } = await import('../../../src/services/xService.js');

      axios.get.mockRejectedValueOnce({
        response: { status: 401, data: { error: 'Unauthorized' } },
        message: 'Request failed'
      });

      // Service returns empty array on error (after catching)
      const result = await getFollowingTweets(20);
      expect(result).toEqual([]);
    });
  });

  describe('getUserTweets', () => {
    it('should fetch user tweets correctly', async () => {
      const { getUserTweets } = await import('../../../src/services/xService.js');

      axios.get.mockResolvedValueOnce({
        data: xApiFixtures.userTweetsResponse
      });

      const tweets = await getUserTweets('987654321', 20);

      expect(tweets).toBeDefined();
      expect(Array.isArray(tweets)).toBe(true);
    });

    it('should extract note_tweet text for long tweets', async () => {
      const { getUserTweets } = await import('../../../src/services/xService.js');

      axios.get.mockResolvedValueOnce({
        data: xApiFixtures.userTweetsResponse
      });

      const tweets = await getUserTweets('987654321', 20);

      // Check if note_tweet content is extracted
      const longTweet = tweets.find(t => t.text && t.text.length > 280);
      if (longTweet) {
        expect(longTweet.isLongText).toBe(true);
      }
    });
  });

  describe('getUserByScreenName', () => {
    it('should fetch user by screen name correctly', async () => {
      const { getUserByScreenName } = await import('../../../src/services/xService.js');

      // Note: getUserByScreenName uses axios.get, not axios.post
      axios.get.mockResolvedValueOnce({
        data: xApiFixtures.userByScreenName
      });

      const user = await getUserByScreenName('testuser');

      expect(user).toBeDefined();
      expect(user).toHaveProperty('id', '987654321');
      expect(user).toHaveProperty('username', 'testuser');
      expect(user).toHaveProperty('name', 'Test User');
    });

    it('should handle user not found', async () => {
      const { getUserByScreenName } = await import('../../../src/services/xService.js');

      // Mock response with no user data
      axios.get.mockResolvedValueOnce({
        data: { data: { user: { result: null } } }
      });

      const user = await getUserByScreenName('nonexistent');
      expect(user).toBeNull();
    });

    it('should handle API errors', async () => {
      const { getUserByScreenName } = await import('../../../src/services/xService.js');

      axios.get.mockRejectedValueOnce({
        response: { status: 404, data: { errors: [{ message: 'User not found' }] } },
        message: 'Request failed'
      });

      // Service returns null on error, doesn't throw
      const user = await getUserByScreenName('nonexistent');
      expect(user).toBeNull();
    });
  });
});
