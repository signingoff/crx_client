import { describe, it, expect } from 'vitest';

describe('X Service Utils Unit Tests', () => {
  describe('isJapaneseText', () => {
    // Inline implementation for testing
    function isJapaneseText(text) {
      if (!text) return false;
      const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
      return japaneseRegex.test(text);
    }

    it('should detect hiragana', () => {
      expect(isJapaneseText('こんにちは')).toBe(true);
      expect(isJapaneseText('あいうえお')).toBe(true);
      expect(isJapaneseText('ひらがな')).toBe(true);
    });

    it('should detect katakana', () => {
      expect(isJapaneseText('アイウエオ')).toBe(true);
      expect(isJapaneseText('カタカナ')).toBe(true);
      expect(isJapaneseText('コンピュータ')).toBe(true);
    });

    it('should return false for English', () => {
      expect(isJapaneseText('Hello World')).toBe(false);
      expect(isJapaneseText('This is a test')).toBe(false);
      expect(isJapaneseText('ABCDEFG')).toBe(false);
    });

    it('should return false for Chinese', () => {
      expect(isJapaneseText('你好世界')).toBe(false);
      expect(isJapaneseText('中文测试')).toBe(false);
      expect(isJapaneseText('这是一个测试')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isJapaneseText('')).toBe(false);
      expect(isJapaneseText(null)).toBe(false);
      expect(isJapaneseText(undefined)).toBe(false);
      expect(isJapaneseText('   ')).toBe(false);
      expect(isJapaneseText('12345')).toBe(false);
    });

    it('should detect mixed text with Japanese', () => {
      expect(isJapaneseText('Hello こんにちは')).toBe(true);
      expect(isJapaneseText('Test アイウエオ')).toBe(true);
      // "にほんご" contains hiragana characters
      expect(isJapaneseText('English with にほんご')).toBe(true);
      // Chinese characters without hiragana/katakana should not be detected as Japanese
      expect(isJapaneseText('中文测试')).toBe(false);
    });
  });

  describe('isKoreanText', () => {
    function isKoreanText(text) {
      if (!text) return false;
      const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
      return koreanRegex.test(text);
    }

    it('should detect Korean hangul', () => {
      expect(isKoreanText('안녕하세요')).toBe(true);
      expect(isKoreanText('한국어')).toBe(true);
      expect(isKoreanText('테스트')).toBe(true);
    });

    it('should return false for non-Korean', () => {
      expect(isKoreanText('Hello World')).toBe(false);
      expect(isKoreanText('你好世界')).toBe(false);
      expect(isKoreanText('こんにちは')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isKoreanText('')).toBe(false);
      expect(isKoreanText(null)).toBe(false);
      expect(isKoreanText(undefined)).toBe(false);
    });

    it('should detect mixed text with Korean', () => {
      expect(isKoreanText('Hello 안녕하세요')).toBe(true);
      expect(isKoreanText('Test 한국어')).toBe(true);
    });
  });

  describe('formatTweet', () => {
    function formatTweet(tweetData) {
      const tweet = tweetData.legacy || tweetData;
      const user = tweetData.core?.user_results?.result || {};
      const userLegacy = user.legacy || {};
      const userCore = user.core || {};

      const noteTweetText = tweetData.note_tweet?.note_tweet_results?.result?.text
        || tweetData.result?.note_tweet?.note_tweet_results?.result?.text
        || tweet.note_tweet?.note_tweet_results?.result?.text;

      const fullText = noteTweetText || tweet.full_text || tweet.text || '';
      const authorId = tweet.user_id_str || userCore.id_str || userCore.id;

      if (!fullText.trim()) {
        return null;
      }
      if (!authorId) {
        return null;
      }

      const isLongText = !!noteTweetText || fullText.length > 280;

      return {
        id: tweet.id_str,
        text: fullText,
        isLongText,
        createdAt: tweet.created_at,
        author: {
          id: authorId,
          name: userCore.name,
          username: userCore.screen_name,
          avatar: user.avatar?.image_url?.replace('_normal', ''),
          description: userLegacy.description,
          location: userCore.location,
          createdAt: userCore.created_at,
          followingCount: userLegacy.friends_count,
          followersCount: userLegacy.followers_count
        },
        metrics: {
          replies: tweet.reply_count,
          retweets: tweet.retweet_count,
          likes: tweet.favorite_count,
          views: tweetData.views?.count
        }
      };
    }

    it('should format standard tweet correctly', () => {
      const mockData = {
        legacy: {
          id_str: '123456',
          full_text: 'Test tweet content',
          created_at: '2024-01-01T00:00:00.000Z',
          user_id_str: '789',
          reply_count: 5,
          retweet_count: 10,
          favorite_count: 20
        },
        core: {
          user_results: {
            result: {
              core: {
                name: 'Test User',
                screen_name: 'testuser',
                location: 'Test City'
              },
              legacy: {
                description: 'Test description',
                friends_count: 100,
                followers_count: 200
              }
            }
          }
        },
        views: { count: '1000' }
      };

      const result = formatTweet(mockData);

      expect(result).not.toBeNull();
      expect(result.id).toBe('123456');
      expect(result.text).toBe('Test tweet content');
      expect(result.isLongText).toBe(false);
      expect(result.author.name).toBe('Test User');
      expect(result.author.username).toBe('testuser');
      expect(result.metrics.likes).toBe(20);
      expect(result.metrics.views).toBe('1000');
    });

    it('should return null for empty text', () => {
      const mockData = {
        legacy: {
          id_str: '123',
          full_text: '   ',
          user_id_str: '789'
        }
      };

      expect(formatTweet(mockData)).toBeNull();
    });

    it('should return null for missing author ID', () => {
      const mockData = {
        legacy: {
          id_str: '123',
          full_text: 'Test content'
        }
      };

      expect(formatTweet(mockData)).toBeNull();
    });

    it('should detect long text tweets', () => {
      const longText = 'a'.repeat(281);
      const mockData = {
        legacy: {
          id_str: '123',
          full_text: longText,
          user_id_str: '789'
        }
      };

      const result = formatTweet(mockData);
      expect(result.isLongText).toBe(true);
    });

    it('should extract note_tweet text', () => {
      const mockData = {
        legacy: {
          id_str: '123',
          full_text: 'truncated...',
          user_id_str: '789'
        },
        note_tweet: {
          note_tweet_results: {
            result: {
              text: 'Full long tweet content here'
            }
          }
        }
      };

      const result = formatTweet(mockData);
      expect(result.text).toBe('Full long tweet content here');
      expect(result.isLongText).toBe(true);
    });
  });
});
