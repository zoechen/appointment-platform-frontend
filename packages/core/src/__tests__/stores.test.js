import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../socketClient.js', () => ({
  connectRealtime: vi.fn(),
  disconnectRealtime: vi.fn(),
  getSocket: vi.fn(),
  onRealtimeEvent: vi.fn()
}))

const {
  configure,
  useAuthStore,
  useAppointmentsStore,
  useChannelsStore,
  useStaffStore
} = await import('../index.js')

describe('@app/core stores 與 apiClient 整合測試', () => {
  let mockFetch

  beforeEach(() => {
    mockFetch = vi.fn()
    globalThis.fetch = mockFetch
    configure({ baseUrl: 'http://localhost:8080', realtimeUrl: 'http://localhost:8080' })
    useAuthStore.getState().logout()
  })

  function jsonResponse(status, payload) {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      headers: {
        get: (name) => (name.toLowerCase() === 'content-type' ? 'application/json' : null)
      },
      json: async () => payload
    })
  }

  it('useAuthStore.loginWithPassword 成功後寫入 token 並切換為 authenticated', async () => {
    mockFetch.mockImplementationOnce(() =>
      jsonResponse(200, {
        token: 'jwt-123',
        business: { BusinessId: 'b1', Name: '好棒沙龍', TimeZone: 'Asia/Taipei' },
        staff: { StaffId: 's1', DisplayName: '店長', Role: 'owner' }
      })
    )

    await useAuthStore.getState().loginWithPassword({
      email: 'owner@example.com',
      password: 'password123'
    })

    const state = useAuthStore.getState()
    expect(state.status).toBe('authenticated')
    expect(state.token).toBe('jwt-123')
    expect(state.staff.Role).toBe('owner')
  })

  it('已登入狀態下呼叫任何 API 若收到 401，自動觸發登出（onUnauthorized）', async () => {
    useAuthStore.getState().hydrate({
      token: 'expired-jwt',
      business: { BusinessId: 'b1' },
      staff: { StaffId: 's1', Role: 'owner' }
    })
    expect(useAuthStore.getState().status).toBe('authenticated')

    mockFetch.mockImplementationOnce(() =>
      jsonResponse(401, { error: '登入憑證無效或已過期' })
    )

    await expect(useAppointmentsStore.getState().fetchAppointments()).rejects.toThrow(
      '登入憑證無效或已過期'
    )

    expect(useAuthStore.getState().status).toBe('idle')
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('useChannelsStore 支援讀取待勾選粉專並呼叫 finalize 完成綁定', async () => {
    useAuthStore.getState().hydrate({
      token: 'valid-jwt',
      business: { BusinessId: 'b1' },
      staff: { StaffId: 's1', Role: 'owner' }
    })

    mockFetch
      .mockImplementationOnce(() =>
        jsonResponse(200, {
          pages: [{ id: 'p1', name: '粉專一', instagramBusinessAccount: { id: 'ig1' } }]
        })
      )
      .mockImplementationOnce(() =>
        jsonResponse(200, {
          channels: [{ ChannelId: 'c1', Platform: 'facebook', DisplayName: '粉專一' }]
        })
      )
      .mockImplementationOnce(() =>
        jsonResponse(200, {
          channels: [{ ChannelId: 'c1', Platform: 'facebook', DisplayName: '粉專一' }]
        })
      )

    const pages = await useChannelsStore.getState().fetchPendingFacebookPages()
    expect(pages).toHaveLength(1)
    expect(useChannelsStore.getState().pendingPages).toHaveLength(1)

    await useChannelsStore.getState().finalizeFacebookPages({
      pageIds: ['p1'],
      bindInstagram: true
    })
    expect(useChannelsStore.getState().pendingPages).toHaveLength(0)
    expect(useChannelsStore.getState().items).toHaveLength(1)
  })

  it('useStaffStore 支援查詢員工名額與建立邀請', async () => {
    useAuthStore.getState().hydrate({
      token: 'valid-jwt',
      business: { BusinessId: 'b1' },
      staff: { StaffId: 's1', Role: 'owner' }
    })

    mockFetch
      .mockImplementationOnce(() =>
        jsonResponse(201, {
          invitation: { InvitationId: 'inv-1', Email: 'staff@example.com', Status: 'pending' },
          token: 'plain-token',
          inviteUrl: 'http://localhost:8080/invite/plain-token'
        })
      )
      .mockImplementationOnce(() =>
        jsonResponse(200, {
          staff: [{ StaffId: 's1', DisplayName: '店長', Role: 'owner' }],
          invitations: [{ InvitationId: 'inv-1', Email: 'staff@example.com', Status: 'pending' }],
          seats: { used: 1, max: 3, available: 2 }
        })
      )

    const result = await useStaffStore.getState().createInvitation('staff@example.com')
    expect(result.token).toBe('plain-token')
    expect(useStaffStore.getState().seats).toMatchObject({ used: 1, max: 3, available: 2 })
    expect(useStaffStore.getState().invitations).toHaveLength(1)
  })
})
