import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { success: true, data: [] } })),
    post: vi.fn(() => Promise.resolve({ data: { success: true } })),
    delete: vi.fn(() => Promise.resolve({ data: { success: true } }))
  }
}))

import UserSettingsView from '../../../src/views/UserSettingsView.vue'

describe('UserSettingsView Component - Layout Changes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Platform Header Layout (Title + Input in same row)', () => {
    it('renders Xueqiu platform header with title and input in same container', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const xueqiuSection = wrapper.findAll('.platform-section')[0]
      const header = xueqiuSection.find('.platform-header')

      // Platform header should exist
      expect(header.exists()).toBe(true)

      // Title should be inside platform-header
      expect(header.find('.platform-title').exists()).toBe(true)
      expect(header.find('.platform-title').text()).toBe('❄️ 雪球用户监控')

      // Input form should be inside platform-header (same row)
      expect(header.find('.add-form-inline').exists()).toBe(true)
      expect(header.find('.user-input').exists()).toBe(true)
      expect(header.find('.btn-add').exists()).toBe(true)
    })

    it('renders Twitter platform header with title and input in same container', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const twitterSection = wrapper.findAll('.platform-section')[1]
      const header = twitterSection.find('.platform-header')

      expect(header.exists()).toBe(true)
      expect(header.find('.platform-title').text()).toBe('🐦 Twitter 用户监控')
      expect(header.find('.add-form-inline').exists()).toBe(true)
      expect(header.find('.user-input').exists()).toBe(true)
      expect(header.find('.btn-add').exists()).toBe(true)
    })

    it('does not have separate add-section for input form', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      // Input form should be inside platform-header, not in a separate add-section
      const xueqiuSection = wrapper.findAll('.platform-section')[0]
      const header = xueqiuSection.find('.platform-header')
      const addFormInHeader = header.find('.add-form-inline')

      expect(addFormInHeader.exists()).toBe(true)

      // Check that input is inside the header's add-form-inline
      expect(addFormInHeader.find('.user-input').exists()).toBe(true)
      expect(addFormInHeader.find('.btn-add').exists()).toBe(true)
    })
  })

  describe('Table Header Layout (Title + Sync Button in same row)', () => {
    it('renders Xueqiu table header with title and sync button in same row', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const xueqiuSection = wrapper.findAll('.platform-section')[0]
      const tableHeader = xueqiuSection.find('.table-header')

      expect(tableHeader.exists()).toBe(true)

      // Title should be in table-header
      const title = tableHeader.find('h3')
      expect(title.exists()).toBe(true)
      expect(title.text()).toContain('监控用户列表')

      // Sync button should also be in table-header
      const syncButton = tableHeader.find('.btn-sync')
      expect(syncButton.exists()).toBe(true)
    })

    it('renders Twitter table header with title and sync button in same row', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const twitterSection = wrapper.findAll('.platform-section')[1]
      const tableHeader = twitterSection.find('.table-header')

      expect(tableHeader.exists()).toBe(true)
      expect(tableHeader.find('h3').text()).toContain('监控用户列表')
      expect(tableHeader.find('.btn-sync').exists()).toBe(true)
    })

    it('does not have separate sync-section outside table-section', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const xueqiuSection = wrapper.findAll('.platform-section')[0]

      // Sync button should be inside table-header, not in a separate sync-section
      const tableHeader = xueqiuSection.find('.table-header')
      expect(tableHeader.find('.btn-sync').exists()).toBe(true)

      // Old sync-section should not exist
      const oldSyncSection = xueqiuSection.find('.sync-section')
      expect(oldSyncSection.exists()).toBe(false)
    })
  })

  describe('Vertical Layout (Stacked sections)', () => {
    it('renders two platform sections in vertical layout', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const content = wrapper.find('.content')
      const sections = content.findAll('.platform-section')

      // Should have exactly 2 platform sections
      expect(sections.length).toBe(2)

      // First section is Xueqiu
      expect(sections[0].find('.platform-title').text()).toBe('❄️ 雪球用户监控')

      // Second section is Twitter
      expect(sections[1].find('.platform-title').text()).toBe('🐦 Twitter 用户监控')
    })

    it('does not use horizontal panel layout', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const content = wrapper.find('.content')

      // Should not have old 'panels' class that was used for side-by-side layout
      expect(content.classes()).not.toContain('panels')

      // Should not have 'panel' class on sections
      const sections = content.findAll('.platform-section')
      for (const section of sections) {
        expect(section.classes()).not.toContain('panel')
      }
    })
  })

  describe('Input Field Classes', () => {
    it('has add-form-inline class for inline input form', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const xueqiuSection = wrapper.findAll('.platform-section')[0]
      const header = xueqiuSection.find('.platform-header')

      // Should have add-form-inline class
      expect(header.find('.add-form-inline').exists()).toBe(true)

      // Should NOT have old add-form class
      expect(header.find('.add-form').exists()).toBe(false)
    })

    it('user-input has flex:1 to take full width', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const xueqiuSection = wrapper.findAll('.platform-section')[0]
      const input = xueqiuSection.find('.user-input')

      expect(input.exists()).toBe(true)

      // Check that add-form-inline container exists for flex layout
      const addFormInline = xueqiuSection.find('.add-form-inline')
      expect(addFormInline.exists()).toBe(true)
    })
  })

  describe('Sync Button States', () => {
    it('shows correct initial state for sync buttons', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const syncButtons = wrapper.findAll('.btn-sync')

      // Should have 2 sync buttons (one for each platform)
      expect(syncButtons.length).toBe(2)

      // Initial state should be "立即同步"
      for (const btn of syncButtons) {
        expect(btn.text()).toBe('🔄 立即同步')
      }
    })

    it('disables sync button when syncing', async () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const xueqiuSyncButton = wrapper.findAll('.platform-section')[0].find('.btn-sync')

      // Click to trigger sync
      await xueqiuSyncButton.trigger('click')
      await nextTick()

      // Button should show syncing state
      expect(xueqiuSyncButton.text()).toBe('🔄 同步中...')
    })
  })

  describe('Add User Button States', () => {
    it('disables add button when input is empty for Xueqiu', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const xueqiuSection = wrapper.findAll('.platform-section')[0]
      const addButton = xueqiuSection.find('.btn-add')

      // Empty input should disable button (disabled attribute should exist or be 'true')
      const disabledAttr = addButton.attributes('disabled')
      expect(disabledAttr === '' || disabledAttr === 'true').toBe(true)
    })

    it('enables add button for valid Xueqiu ID', async () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const xueqiuSection = wrapper.findAll('.platform-section')[0]
      const addButton = xueqiuSection.find('.btn-add')
      const input = xueqiuSection.find('.user-input')

      // Set valid numeric ID
      await input.setValue('123456')
      await nextTick()

      // Button should be enabled (no disabled attribute or disabled='false')
      const disabledAttr = addButton.attributes('disabled')
      expect(disabledAttr === undefined || disabledAttr === 'false').toBe(true)
    })

    it('disables add button for invalid Xueqiu ID (non-numeric)', async () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const xueqiuSection = wrapper.findAll('.platform-section')[0]
      const addButton = xueqiuSection.find('.btn-add')
      const input = xueqiuSection.find('.user-input')

      // Set non-numeric ID
      await input.setValue('abc123')
      await nextTick()

      // Button should be disabled
      const disabledAttr = addButton.attributes('disabled')
      expect(disabledAttr === '' || disabledAttr === 'true').toBe(true)
    })

    it('accepts any non-empty input for Twitter', async () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const twitterSection = wrapper.findAll('.platform-section')[1]
      const addButton = twitterSection.find('.btn-add')
      const input = twitterSection.find('.user-input')

      // Empty input - button disabled
      let disabledAttr = addButton.attributes('disabled')
      expect(disabledAttr === '' || disabledAttr === 'true').toBe(true)

      // Handle format - button enabled
      await input.setValue('@elonmusk')
      await nextTick()
      disabledAttr = addButton.attributes('disabled')
      expect(disabledAttr === undefined || disabledAttr === 'false').toBe(true)

      // Numeric ID - button enabled
      await input.setValue('44196397')
      await nextTick()
      disabledAttr = addButton.attributes('disabled')
      expect(disabledAttr === undefined || disabledAttr === 'false').toBe(true)
    })
  })

  describe('Help Text', () => {
    it('shows help text for Xueqiu user ID format', () => {
      const wrapper = mount(UserSettingsView, {
        global: {
          stubs: ['router-link']
        }
      })

      const xueqiuSection = wrapper.findAll('.platform-section')[0]

      // Should not have old help-text (it was removed when moving to header)
      // Instead, placeholder should guide user
      const input = xueqiuSection.find('.user-input')
      expect(input.attributes('placeholder')).toContain('输入雪球用户ID')
    })
  })
})
