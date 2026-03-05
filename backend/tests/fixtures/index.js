/**
 * Test Fixtures
 * 集中管理所有测试数据
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadJson(filename) {
  return JSON.parse(readFileSync(join(__dirname, filename), 'utf-8'));
}

// X API Fixtures
export const xApiFixtures = {
  timelineResponse: loadJson('x-api/timeline-response.json'),
  userTweetsResponse: loadJson('x-api/user-tweets-response.json'),
  userByScreenName: loadJson('x-api/user-by-screenname.json')
};

// 雪球 API Fixtures
export const xueqiuApiFixtures = {
  userTimeline: loadJson('xueqiu-api/user-timeline.json')
};

// Mock Tweets
export const mockTweets = {
  standard: {
    id: '123456789',
    text: 'This is a test tweet for unit testing purposes.',
    createdAt: '2024-01-15T10:30:00.000Z',
    author: {
      id: '987654321',
      name: 'Test User',
      username: 'testuser',
      avatar: 'https://pbs.twimg.com/profile_images/test.jpg',
      description: 'Test bio',
      location: 'Test City',
      createdAt: '2020-01-01T00:00:00.000Z',
      followingCount: 100,
      followersCount: 200
    },
    metrics: {
      replies: 5,
      retweets: 10,
      likes: 20,
      views: 1000
    },
    media: [],
    entities: { hashtags: [], urls: [], mentions: [] },
    isLongText: false
  },

  japanese: {
    id: '987654321',
    text: 'これは日本語のツイートです。フィルタリングのテストに使います。',
    createdAt: '2024-01-15T09:00:00.000Z',
    author: {
      id: '567890123',
      name: 'Another User',
      username: 'anotheruser',
      avatar: 'https://pbs.twimg.com/profile_images/another.jpg',
      description: 'Another test bio',
      location: 'Another City'
    },
    metrics: { replies: 2, retweets: 5, likes: 8, views: 500 },
    isLongText: false
  },

  korean: {
    id: '555666777',
    text: '이것은 한국어 트윗입니다. 필터링 테스트용입니다.',
    createdAt: '2024-01-15T08:00:00.000Z',
    author: {
      id: '111222333',
      name: 'Korean User',
      username: 'koreanuser',
      avatar: 'https://pbs.twimg.com/profile_images/korean.jpg'
    },
    metrics: { replies: 1, retweets: 3, likes: 5 },
    isLongText: false
  },

  longText: {
    id: '111222333',
    text: 'User timeline test tweet with long text that exceeds the normal 280 character limit for standard tweets. This is a test for note_tweet functionality and text extraction logic. The full content is stored here for long tweets.',
    createdAt: '2024-01-14T08:00:00.000Z',
    author: {
      id: '987654321',
      name: 'Test User',
      username: 'testuser',
      avatar: 'https://pbs.twimg.com/profile_images/test.jpg'
    },
    metrics: { replies: 3, retweets: 7, likes: 15, views: 750 },
    isLongText: true,
    entities: { hashtags: [{ text: 'testing' }] }
  },

  withMedia: {
    id: '444555666',
    text: 'Tweet with media attachments for testing image grid display.',
    createdAt: '2024-01-14T07:00:00.000Z',
    author: {
      id: '987654321',
      name: 'Test User',
      username: 'testuser',
      avatar: 'https://pbs.twimg.com/profile_images/test.jpg'
    },
    metrics: { replies: 4, retweets: 8, likes: 25 },
    media: [
      { type: 'photo', url: 'https://pbs.twimg.com/media/test1.jpg', thumbnail: 'https://pbs.twimg.com/media/test1.jpg?name=small' },
      { type: 'photo', url: 'https://pbs.twimg.com/media/test2.jpg', thumbnail: 'https://pbs.twimg.com/media/test2.jpg?name=small' }
    ],
    isLongText: false
  },

  retweet: {
    id: '777888999',
    text: 'RT @originaluser: This is the original tweet being retweeted.',
    createdAt: '2024-01-14T06:00:00.000Z',
    author: {
      id: '987654321',
      name: 'Test User',
      username: 'testuser',
      avatar: 'https://pbs.twimg.com/profile_images/test.jpg'
    },
    retweetedTweet: {
      id: '111000222',
      text: 'This is the original tweet being retweeted.',
      author: {
        name: 'Original User',
        username: 'originaluser'
      }
    },
    isRetweet: true,
    metrics: { replies: 0, retweets: 5, likes: 10 }
  }
};

// Mock Xueqiu Posts
export const mockXueqiuPosts = {
  standard: {
    id: '123456789',
    text: 'This is a test post from Xueqiu for testing purposes.',
    createdAt: '2024-01-15T10:00:00.000Z',
    user_id: 12345,
    user_screen_name: 'TestInvestor',
    user_avatar: 'https://avatars.xueqiu.com/test.jpg',
    replies_count: 5,
    reposts_count: 3,
    likes_count: 20,
    source: 'iPhone',
    sourceType: 'xueqiu'
  },

  withTitle: {
    id: '987654321',
    title: 'Test Xueqiu Post Title',
    text: 'Another test post with different content for variety in testing.',
    createdAt: '2024-01-14T18:00:00.000Z',
    user_id: 12345,
    user_screen_name: 'TestInvestor',
    replies_count: 2,
    reposts_count: 1,
    likes_count: 10
  }
};

// Mock Users
export const mockUsers = {
  twitter: {
    id: '987654321',
    screen_name: 'testuser',
    name: 'Test User',
    description: 'Test bio description',
    location: 'Test City',
    profile_image_url: 'https://pbs.twimg.com/profile_images/test.jpg',
    followers_count: 200,
    friends_count: 100,
    created_at: 'Mon Jan 01 00:00:00 +0000 2020'
  },

  xueqiu: {
    id: 12345,
    user_id: 12345,
    screen_name: 'TestInvestor',
    description: 'Test investor bio',
    profile_image_url: 'https://avatars.xueqiu.com/test.jpg',
    followers_count: 1000,
    friends_count: 50
  }
};
