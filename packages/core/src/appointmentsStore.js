import { create } from 'zustand'
import { apiClient } from './apiClient.js'

/**
 * 預約列表的狀態管理 + 即時事件的套用邏輯（appointment:new / appointment:updated
 * 由 App 層在建立 socket 連線後呼叫 applyRealtimeEvent 轉發進來，這個 store
 * 本身不直接依賴 socket.io，保持跟傳輸層解耦。
 */
export const useAppointmentsStore = create((set, get) => ({
  items: [],
  status: 'idle', // idle / loading / loaded / error
  error: null,

  async fetchAppointment(id) {
    const data = await apiClient.request(`/appointments/${id}`)
    set({
      items: [...get().items.filter((a) => a.AppointmentId !== id), data.appointment]
    })
    return data.appointment
  },

  async fetchAppointments({ from, to, status } = {}) {
    set({ status: 'loading', error: null })
    try {
      const data = await apiClient.request('/appointments', { query: { from, to, status } })
      set({ items: data.appointments, status: 'loaded' })
    } catch (err) {
      set({ status: 'error', error: err.message })
      throw err
    }
  },

  async createAppointment(payload) {
    const data = await apiClient.request('/appointments', { method: 'POST', body: payload })
    set({ items: [...get().items, data.appointment] })
    return data.appointment
  },

  async updateAppointment(id, changes) {
    const data = await apiClient.request(`/appointments/${id}`, { method: 'PATCH', body: changes })
    set({
      items: get().items.map((a) => (a.AppointmentId === id ? data.appointment : a))
    })
    return data.appointment
  },

  async cancelAppointment(id) {
    const data = await apiClient.request(`/appointments/${id}`, { method: 'DELETE' })
    set({
      items: get().items.map((a) => (a.AppointmentId === id ? data.appointment : a))
    })
    return data.appointment
  },

  /** 由 App 層收到 Socket.IO 事件時呼叫，把即時異動套用到本地清單 */
  applyRealtimeEvent(event, appointment) {
    if (event === 'appointment:new') {
      const exists = get().items.some((a) => a.AppointmentId === appointment.AppointmentId)
      if (!exists) set({ items: [...get().items, appointment] })
    } else if (event === 'appointment:updated') {
      set({
        items: get().items.map((a) =>
          a.AppointmentId === appointment.AppointmentId ? appointment : a
        )
      })
    }
  }
}))
