import { create } from 'zustand'
import { apiClient } from './apiClient.js'

export const useStaffStore = create((set, get) => ({
  staff: [],
  invitations: [],
  seats: null,
  status: 'idle',
  error: null,

  async fetchStaff() {
    set({ status: 'loading', error: null })
    try {
      const data = await apiClient.request('/staff')
      set({
        staff: data.staff || [],
        invitations: data.invitations || [],
        seats: data.seats || null,
        status: 'loaded'
      })
      return data
    } catch (err) {
      set({ status: 'error', error: err.message })
      throw err
    }
  },

  async createInvitation(email) {
    const data = await apiClient.request('/staff-invitations', {
      method: 'POST',
      body: { email }
    })
    await get().fetchStaff()
    return data // { invitation, token, inviteUrl }
  },

  async revokeInvitation(invitationId) {
    await apiClient.request(`/staff-invitations/${invitationId}`, {
      method: 'DELETE'
    })
    await get().fetchStaff()
  },

  async updateStaff(staffId, changes) {
    const data = await apiClient.request(`/staff/${staffId}`, {
      method: 'PATCH',
      body: changes
    })
    await get().fetchStaff()
    return data.staff
  },

  async previewInvitation(token) {
    const data = await apiClient.request(`/invitations/${encodeURIComponent(token)}`)
    return data.invitation
  },

  async acceptInvitation(token, { displayName, password }) {
    return apiClient.request(`/invitations/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
      body: { displayName, password }
    })
  }
}))
