import { create } from 'zustand'
import { apiClient } from './apiClient.js'

export const useChannelsStore = create((set, get) => ({
  items: [],
  pendingPages: [],
  status: 'idle',
  error: null,

  async fetchChannels() {
    set({ status: 'loading', error: null })
    try {
      const data = await apiClient.request('/channels')
      set({ items: data.channels, status: 'loaded' })
    } catch (err) {
      set({ status: 'error', error: err.message })
      throw err
    }
  },

  /**
   * Facebook/Instagram 綁定是後端導轉 OAuth 頁面完成的。這裡呼叫後端拿到
   * 已經帶上簽章 state 的網址，再交給 App 層用系統瀏覽器開啟
   * （瀏覽器導頁沒辦法帶 Authorization header，所以身分驗證要在這支 API 呼叫時做完）。
   * 預設帶 select=true，當使用者管理多個粉專時可回到 App 勾選要綁定的粉專。
   */
  async getFacebookConnectUrl({ select = true } = {}) {
    const data = await apiClient.request('/channels/facebook/connect-url', {
      query: select ? { select: 'true' } : undefined
    })
    return data.url
  },

  async fetchPendingFacebookPages() {
    try {
      const data = await apiClient.request('/channels/facebook/pending-pages')
      set({ pendingPages: data.pages || [] })
      return data.pages || []
    } catch {
      set({ pendingPages: [] })
      return []
    }
  },

  async finalizeFacebookPages({ pageIds, bindInstagram = true }) {
    const data = await apiClient.request('/channels/facebook/finalize', {
      method: 'POST',
      body: { pageIds, bindInstagram }
    })
    set({ pendingPages: [] })
    await get().fetchChannels()
    return data.channels
  },

  async bindLineChannel({ channelSecret, channelAccessToken }) {
    const data = await apiClient.request('/channels/line/connect', {
      method: 'POST',
      body: { channelSecret, channelAccessToken }
    })
    set({
      items: [...get().items.filter((c) => c.ChannelId !== data.channel.ChannelId), data.channel]
    })
    return data.channel
  },

  async removeChannel(channelId) {
    await apiClient.request(`/channels/${channelId}`, { method: 'DELETE' })
    set({ items: get().items.filter((c) => c.ChannelId !== channelId) })
  }
}))
