import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @supabase/supabase-js before importing supabase.js
const mockRange = vi.fn()
const mockOrder = vi.fn(() => ({ range: mockRange }))
const mockNeq = vi.fn(() => ({ order: mockOrder }))
const mockSelect = vi.fn(() => ({ neq: mockNeq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: mockFrom })
}))

process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'test-key'

const { getAllTwitterPosts } = await import('../../src/db/supabase.js')

describe('getAllTwitterPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrder.mockReturnValue({ range: mockRange })
    mockNeq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ neq: mockNeq })
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  it('filters out is_read posts', async () => {
    mockRange.mockResolvedValue({ data: [], count: 0, error: null })

    await getAllTwitterPosts(1, 20)

    expect(mockNeq).toHaveBeenCalledWith('is_read', true)
  })

  it('returns posts and total from the response', async () => {
    const fakePosts = [
      { tweet_id: '1', text: 'hello', is_read: false },
      { tweet_id: '2', text: 'world', is_read: false },
    ]
    mockRange.mockResolvedValue({ data: fakePosts, count: 2, error: null })

    const result = await getAllTwitterPosts(1, 20)

    expect(result.posts).toEqual(fakePosts)
    expect(result.total).toBe(2)
  })

  it('paginates correctly — page 2 with limit 10 queries range 10-19', async () => {
    mockRange.mockResolvedValue({ data: [], count: 0, error: null })

    await getAllTwitterPosts(2, 10)

    expect(mockRange).toHaveBeenCalledWith(10, 19)
  })

  it('returns empty result on supabase error', async () => {
    mockRange.mockResolvedValue({ data: null, count: null, error: { message: 'DB error' } })

    const result = await getAllTwitterPosts(1, 20)

    expect(result).toEqual({ posts: [], total: 0 })
  })
})
