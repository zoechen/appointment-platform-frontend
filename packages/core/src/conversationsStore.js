import { create } from 'zustand'
import { apiClient } from './apiClient.js'

export const useConversationsStore = create((set, get) => ({
  items: [],
  messagesByConversation: {}, // { [conversationId]: Message[] }
  status: 'idle',
  error: null,

  async fetchConversations({ platform, status } = {}) {
    set({ status: 'loading', error: null })
    try {
      const data = await apiClient.request('/conversations', { query: { platform, status } })
      set({ items: data.conversations, status: 'loaded' })
    } catch (err) {
      set({ status: 'error', error: err.message })
      throw err
    }
  },

  /** 單筆讀取，主要給對話串畫面在 items 裡還沒有這筆資料時（例如直接被推播喚醒）當備援 */
  async fetchConversation(id) {
    const data = await apiClient.request(`/conversations/${id}`)
    set({
      items: [...get().items.filter((c) => c.ConversationId !== id), data.conversation]
    })
    return data.conversation
  },

  async fetchMessages(conversationId) {
    const data = await apiClient.request(`/conversations/${conversationId}/messages`)
    set({
      messagesByConversation: { ...get().messagesByConversation, [conversationId]: data.messages }
    })
    return data.messages
  },

  async sendReply(conversationId, text) {
    const data = await apiClient.request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { text }
    })
    get().applyRealtimeEvent('message:new', data.message)
    return data.message
  },

  /** 切換這個對話要「機器人自動回覆」還是「人工回覆」 */
  async setConversationMode(conversationId, mode) {
    const data = await apiClient.request(`/conversations/${conversationId}/mode`, {
      method: 'PATCH',
      body: { mode }
    })
    set({
      items: get().items.map((c) => (c.ConversationId === conversationId ? data.conversation : c))
    })
    return data.conversation
  },

  /** 由 App 層收到 Socket.IO 事件時呼叫 */
  applyRealtimeEvent(event, payload) {
    if (event === 'message:new') {
      const message = payload
      const list = get().messagesByConversation[message.ConversationId] || []
      const exists = list.some((m) => m.MessageId === message.MessageId)
      if (!exists) {
        set({
          messagesByConversation: {
            ...get().messagesByConversation,
            [message.ConversationId]: [...list, message]
          }
        })
      }

      // 同步把該對話拉到列表最上面（用 LastMessageAt 排序時常見的體驗）
      set({
        items: get().items.map((c) =>
          c.ConversationId === message.ConversationId
            ? { ...c, LastMessageAt: message.CreatedAt }
            : c
        )
      })
      return
    }

    if (event === 'conversation:updated') {
      const conversation = payload
      set({
        items: get().items.map((c) =>
          c.ConversationId === conversation.ConversationId ? conversation : c
        )
      })
    }
  }
}))
