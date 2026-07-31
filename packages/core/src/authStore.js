import { create } from 'zustand'
import { apiClient } from './apiClient.js'
import { connectRealtime, disconnectRealtime } from './socketClient.js'

/**
 * 注意：這個 store 本身不處理「把 token 存到裝置上」這件事——
 * RN 跟 Web 的持久化方式不同（SecureStore vs localStorage），
 * 交給各自的 App 層處理，這裡只負責記憶體內的登入狀態與 API 呼叫。
 * App 啟動時若讀到之前存的 token，呼叫 hydrate() 把狀態灌回來即可。
 */
export const useAuthStore = create((set) => ({
  status: 'idle', // idle / loading / authenticated / error
  token: null,
  business: null,
  staff: null,
  error: null,

  async loginWithGoogleIdToken(idToken) {
    set({ status: 'loading', error: null })
    try {
      const data = await apiClient.request('/auth/google', {
        method: 'POST',
        body: { idToken }
      })
      applyAuthResponse(set, data)
      return data
    } catch (err) {
      set({ status: 'error', error: err.message })
      throw err
    }
  },

  /** 用 Email + 密碼註冊新帳號（第一次使用直接建立 Business + Staff owner） */
  async registerWithPassword({ email, password, name }) {
    set({ status: 'loading', error: null })
    try {
      const data = await apiClient.request('/auth/register', {
        method: 'POST',
        body: { email, password, name }
      })
      applyAuthResponse(set, data)
      return data
    } catch (err) {
      set({ status: 'error', error: err.message })
      throw err
    }
  },

  /** 用 Email + 密碼登入既有帳號 */
  async loginWithPassword({ email, password }) {
    set({ status: 'loading', error: null })
    try {
      const data = await apiClient.request('/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      applyAuthResponse(set, data)
      return data
    } catch (err) {
      set({ status: 'error', error: err.message })
      throw err
    }
  },

  hydrate({ token, business, staff }) {
    apiClient.setToken(token)
    connectRealtime({ baseUrl: apiClient.getRealtimeUrl(), token })
    set({ status: 'authenticated', token, business, staff })
  },

  logout() {
    apiClient.clearToken()
    disconnectRealtime()
    set({ status: 'idle', token: null, business: null, staff: null, error: null })
  },

  async refreshMe() {
    const data = await apiClient.request('/auth/me')
    set({ business: data.business })
    return data
  }
}))

/** /auth/google、/auth/register、/auth/login 回應格式一致，登入成功後的處理邏輯共用這支 */
function applyAuthResponse(set, data) {
  apiClient.setToken(data.token)
  connectRealtime({ baseUrl: apiClient.getRealtimeUrl(), token: data.token })
  set({
    status: 'authenticated',
    token: data.token,
    business: data.business,
    staff: data.staff
  })
}

/** 判斷是否已登入的 selector，供元件用 useAuthStore(selectIsAuthenticated) */
export function selectIsAuthenticated(state) {
  return state.status === 'authenticated'
}
