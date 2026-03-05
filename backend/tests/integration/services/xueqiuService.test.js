import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { xueqiuApiFixtures } from '../../fixtures/index.js';

// Mock axios
vi.mock('axios');

// Mock database
vi.mock('../../../src/db/index.js', () => ({
  getSetting: vi.fn(() => Promise.resolve('test_cookie'))
}));

describe('Xueqiu Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseTimelineResponse', () => {
    it('should parse timeline response correctly', async () => {
      const xueqiuService = (await import('../../../src/services/xueqiuService.js')).default;

      const result = xueqiuService.parseTimelineResponse(xueqiuApiFixtures.userTimeline);

      expect(result).toBeDefined();
      expect(Array.isArray(result.statuses)).toBe(true);
      expect(result.statuses.length).toBe(2);
      expect(result.maxPage).toBe(10);

      // Verify post structure
      const firstPost = result.statuses[0];
      expect(firstPost).toHaveProperty('id');
      expect(firstPost).toHaveProperty('text');
      expect(firstPost).toHaveProperty('user');
      expect(firstPost).toHaveProperty('created_at');
    });

    it('should handle empty response', async () => {
      const xueqiuService = (await import('../../../src/services/xueqiuService.js')).default;

      const result = xueqiuService.parseTimelineResponse({ maxPage: 5, statuses: [] });

      expect(result.statuses).toEqual([]);
      expect(result.maxPage).toBe(5);
    });
  });

  describe('parseTimelineItem', () => {
    it('should parse timeline item correctly', async () => {
      const xueqiuService = (await import('../../../src/services/xueqiuService.js')).default;

      const item = xueqiuApiFixtures.userTimeline.statuses[0];
      const post = xueqiuService.parseTimelineItem(item);

      expect(post).toHaveProperty('id', 123456789); // ID is number, not string
      expect(post).toHaveProperty('text');
      expect(post.text).toContain('This is a test post');
      expect(post).toHaveProperty('user');
      expect(post.user).toHaveProperty('screen_name', 'TestInvestor');
    });
  });
});
