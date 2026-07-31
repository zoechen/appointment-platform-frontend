import { create } from 'zustand'
import { apiClient } from './apiClient.js'

export const useChannelsStore = create((set, get) => ({
  items: [],
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
   */
  async getFacebookConnectUrl() {
    const data = await apiClient.request('/channels/facebook/connect-url')
    return data.url
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
