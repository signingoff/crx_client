import { describe, it, expect } from 'vitest'

// 简单的单元测试，测试纯函数逻辑
describe('X Service Utils', () => {
  describe('isJapaneseText', () => {
    // 从 xService.js 提取的函数逻辑
    function isJapaneseText(text) {
      if (!text) return false;
      // 检测平假名和片假名
      const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
      return japaneseRegex.test(text);
    }

    it('should detect Japanese hiragana', () => {
      expect(isJapaneseText('こんにちは')).toBe(true)
      expect(isJapaneseText('あいうえお')).toBe(true)
    })

    it('should detect Japanese katakana', () => {
      expect(isJapaneseText('アイウエオ')).toBe(true)
      expect(isJapaneseText('コンピュータ')).toBe(true)
    })

    it('should allow English text', () => {
      expect(isJapaneseText('Hello World')).toBe(false)
      expect(isJapaneseText('This is a test tweet')).toBe(false)
    })

    it('should allow Chinese text', () => {
      expect(isJapaneseText('你好世界')).toBe(false)
      expect(isJapaneseText('这是一个中文推文')).toBe(false)
    })

    it('should handle empty or null text', () => {
      expect(isJapaneseText('')).toBe(false)
      expect(isJapaneseText(null)).toBe(false)
      expect(isJapaneseText(undefined)).toBe(false)
    })

    it('should detect mixed Japanese and other text', () => {
      expect(isJapaneseText('Hello こんにちは')).toBe(true)
      expect(isJapaneseText('Test アイウエオ')).toBe(true)
    })
  })

  describe('Tweet formatting logic', () => {
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

    it('should format tweet correctly', () => {
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
        views: { count: 1000 }
      }

      const result = formatTweet(mockData)

      expect(result).not.toBeNull()
      expect(result.id).toBe('123456')
      expect(result.text).toBe('Test tweet content')
      expect(result.isLongText).toBe(false)
      expect(result.author.name).toBe('Test User')
      expect(result.author.username).toBe('testuser')
      expect(result.metrics.likes).toBe(20)
    })

    it('should return null for empty text', () => {
      const mockData = {
        legacy: {
          id_str: '123',
          full_text: '   ',
          user_id_str: '789'
        },
        core: {
          user_results: {
            result: {
              core: { name: 'User', screen_name: 'user' },
              legacy: {}
            }
          }
        }
      }

      expect(formatTweet(mockData)).toBeNull()
    })

    it('should return null for missing author ID', () => {
      const mockData = {
        legacy: {
          id_str: '123',
          full_text: 'Test content'
          // no user_id_str
        },
        core: {
          user_results: {
            result: {
              core: {}, // no id_str or id
              legacy: {}
            }
          }
        }
      }

      expect(formatTweet(mockData)).toBeNull()
    })

    it('should detect long text tweets', () => {
      const longText = 'a'.repeat(281)
      const mockData = {
        legacy: {
          id_str: '123',
          full_text: longText,
          user_id_str: '789'
        },
        core: {
          user_results: {
            result: {
              core: { name: 'User', screen_name: 'user' },
              legacy: {}
            }
          }
        }
      }

      const result = formatTweet(mockData)
      expect(result.isLongText).toBe(true)
    })

    it('should extract note_tweet text for long tweets', () => {
      const mockData = {
        legacy: {
          id_str: '123',
          full_text: 'truncated...',
          user_id_str: '789'
        },
        note_tweet: {
          note_tweet_results: {
            result: {
              text: 'This is the full long tweet content that exceeds 280 characters and is stored in the note_tweet field.'
            }
          }
        },
        core: {
          user_results: {
            result: {
              core: { name: 'User', screen_name: 'user' },
              legacy: {}
            }
          }
        }
      }

      const result = formatTweet(mockData)
      expect(result.text).toBe('This is the full long tweet content that exceeds 280 characters and is stored in the note_tweet field.')
      expect(result.isLongText).toBe(true)
    })
  })
})
