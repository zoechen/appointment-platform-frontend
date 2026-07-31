/**
 * 管理後台是完全獨立的系統（獨立的 PlatformAdmins 表、獨立的 JWT），
 * 所以沒有沿用 packages/core 裡給店家 App 用的 apiClient/store——
 * 那些是綁在「Business + Staff」這個資料模型上的，跟這裡的
 * 「跨租戶查詢」形狀不一樣，硬共用反而會讓兩邊都變得難懂。
 * 這裡自己寫一個最小的版本，邏輯跟 packages/core/src/apiClient.js 一致。
 */

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

let token = localStorage.getItem('admin_token') || null

export function setToken(newToken) {
  token = newToken
  if (newToken) {
    localStorage.setItem('admin_token', newToken)
  } else {
    localStorage.removeItem('admin_token')
  }
}

export function getToken() {
  return token
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    }
  }

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    throw new ApiError(data?.error || `API 錯誤（${res.status}）`, res.status)
  }

  return data
}
