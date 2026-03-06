import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock API module
vi.mock('../../../src/api/tweets.js', () => ({
  markTwitterPostRead: vi.fn(() => Promise.resolve()),
  markXueqiuPostRead: vi.fn(() => Promise.resolve())
}))

// Import component after mocking
import TweetCard from '../../../src/components/TweetCard.vue'

describe('TweetCard Component', () => {
  const mockTweet = {
    id: '123456',
    text: 'This is a test tweet content.',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    author: {
      id: '789',
      name: 'Test User',
      username: 'testuser',
      avatar: 'https://example.com/avatar.jpg',
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
    entities: { hashtags: [], urls: [], user_mentions: [] }
  }

  const mockXueqiuTweet = {
    id: '789012',
    text: 'This is a xueqiu post content.',
    source: 'xueqiu',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    userId: '12345',
    author: {
      id: '12345',
      name: 'Test Investor',
      username: 'testinvestor',
      avatar: 'https://example.com/xueqiu-avatar.jpg'
    },
    metrics: {
      replies: 3,
      reposts: 5,
      likes: 15
    }
  }

  const mockRetweet = {
    id: '999888',
    text: 'RT @originaluser: This is the original tweet content.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    author: {
      id: '789',
      name: 'Retweeter User',
      username: 'retweeter',
      avatar: 'https://example.com/retweeter.jpg'
    },
    entities: {
      user_mentions: [
        { screen_name: 'originaluser', name: 'Original User' }
      ]
    }
  }

  const mockTweetWithMedia = {
    ...mockTweet,
    id: '444555',
    media: [
      { type: 'photo', url: 'https://example.com/image1.jpg' },
      { type: 'photo', url: 'https://example.com/image2.jpg' }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders standard tweet correctly', () => {
      const wrapper = mount(TweetCard, {
        props: { tweet: mockTweet }
      })

      expect(wrapper.find('.tweet-card').exists()).toBe(true)
      expect(wrapper.find('.author-name').text()).toBe('Test User')
      expect(wrapper.find('.author-username').text()).toBe('@testuser')
      expect(wrapper.text()).toContain('This is a test tweet content.')
    })

    it('renders xueqiu post with snowflake icon', () => {
      const wrapper = mount(TweetCard, {
        props: { tweet: mockXueqiuTweet }
      })

      expect(wrapper.find('.xueqiu-icon').exists()).toBe(true)
      expect(wrapper.find('.xueqiu-icon').text()).toBe('❄️')
    })

    it('renders retweet with original author info', () => {
      const wrapper = mount(TweetCard, {
        props: { tweet: mockRetweet }
      })

      expect(wrapper.find('.retweet-header').exists()).toBe(true)
      expect(wrapper.text()).toContain('转发了')
      // Should show original content, not RT @...
      expect(wrapper.text()).toContain('This is the original tweet content.')
      expect(wrapper.text()).not.toContain('RT @originaluser:')
    })

    it('renders media grid when photos exist', () => {
      const wrapper = mount(TweetCard, {
        props: { tweet: mockTweetWithMedia }
      })

      const mediaContainer = wrapper.find('.tweet-media')
      expect(mediaContainer.exists()).toBe(true)
      expect(mediaContainer.classes()).toContain('multiple')
      expect(wrapper.findAll('.media-item').length).toBe(2)
    })

    it('shows read indicator when isRead is true', () => {
      const wrapper = mount(TweetCard, {
        props: { tweet: mockTweet, isRead: true }
      })

      expect(wrapper.find('.read-indicator').exists()).toBe(true)
      expect(wrapper.find('.read-indicator').text()).toContain('已读')
    })
  })

  describe('Time formatting', () => {
    it('formats recent time correctly', () => {
      const recentTweet = {
        ...mockTweet,
        createdAt: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
      }

      const wrapper = mount(TweetCard, {
        props: { tweet: recentTweet }
      })

      expect(wrapper.text()).toContain('分钟前')
    })

    it('formats hours correctly', () => {
      const hourTweet = {
        ...mockTweet,
        createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      }

      const wrapper = mount(TweetCard, {
        props: { tweet: hourTweet }
      })

      expect(wrapper.text()).toContain('小时前')
    })
  })

  describe('Number formatting', () => {
    it('formats follower counts', () => {
      const wrapper = mount(TweetCard, {
        props: { tweet: mockTweet }
      })

      // Check that author stats are displayed
      expect(wrapper.find('.author-stats').exists()).toBe(true)
      expect(wrapper.text()).toContain('100')
      expect(wrapper.text()).toContain('200')
    })
  })

  describe('Interactions', () => {
    it('emits select-tweet event on triple click', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TweetCard, {
        props: { tweet: mockTweet }
      })

      // Simulate triple click
      await wrapper.trigger('click')
      await wrapper.trigger('click')
      await wrapper.trigger('click')

      vi.advanceTimersByTime(100)
      await nextTick()

      expect(wrapper.emitted('update:isRead')).toBeTruthy()
      vi.useRealTimers()
    })

    it('does not emit on single click', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TweetCard, {
        props: { tweet: mockTweet }
      })

      await wrapper.trigger('click')
      vi.advanceTimersByTime(600)

      expect(wrapper.emitted('update:isRead')).toBeFalsy()
      vi.useRealTimers()
    })
  })

  describe('Lightbox', () => {
    it('opens lightbox on media click', async () => {
      const wrapper = mount(TweetCard, {
        props: { tweet: mockTweetWithMedia },
        attachTo: document.body
      })

      const mediaItem = wrapper.find('.media-item')
      await mediaItem.trigger('click')
      await nextTick()

      // Lightbox is teleported to body, check document.body
      expect(document.body.querySelector('.lightbox-overlay')).not.toBeNull()

      wrapper.unmount()
    })

    it('closes lightbox on overlay click', async () => {
      const wrapper = mount(TweetCard, {
        props: { tweet: mockTweetWithMedia },
        attachTo: document.body
      })

      // Open lightbox
      await wrapper.find('.media-item').trigger('click')
      await nextTick()
      expect(document.body.querySelector('.lightbox-overlay')).not.toBeNull()

      // Close lightbox by clicking on overlay (use document.body since it's teleported)
      const overlay = document.body.querySelector('.lightbox-overlay')
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()

      expect(document.body.querySelector('.lightbox-overlay')).toBeNull()

      wrapper.unmount()
    })
  })
})
