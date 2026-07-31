import { create } from 'zustand'
import { request, setToken, getToken } from '../api.js'

export const useAdminAuthStore = create((set) => ({
  status: getToken() ? 'authenticated' : 'idle', // idle / loading / authenticated / error
  admin: null,
  error: null,

  async login({ email, password }) {
    set({ status: 'loading', error: null })
    try {
      const data = await request('/admin/auth/login', { method: 'POST', body: { email, password } })
      setToken(data.token)
      set({ status: 'authenticated', admin: data.admin })
      return data
    } catch (err) {
      set({ status: 'error', error: err.message })
      throw err
    }
  },

  async fetchMe() {
    try {
      const data = await request('/admin/me')
      set({ status: 'authenticated', admin: data.admin })
      return data.admin
    } catch {
      setToken(null)
      set({ status: 'idle', admin: null })
      return null
    }
  },

  logout() {
    setToken(null)
    set({ status: 'idle', admin: null, error: null })
  }
}))
