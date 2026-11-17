/**
 * 跨平台（iOS / Android / Web）共用的 API client。
 * 用原生 fetch，Expo/React Native 與瀏覽器都內建，不需要額外的 HTTP 套件。
 *
 * 使用方式：App 啟動時呼叫一次 configure({ baseUrl })，
 * 登入成功後呼叫 setToken(token)，之後所有 request() 呼叫都會自動帶上 Authorization。
 */

let baseUrl = ''
let realtimeUrl = ''
let token = null
let onUnauthorizedHandler = null

export function configure({ baseUrl: url, realtimeUrl: rtUrl, onUnauthorized }) {
  baseUrl = url
  realtimeUrl = rtUrl || url
  if (onUnauthorized !== undefined) {
    onUnauthorizedHandler = onUnauthorized
  }
}

export function setOnUnauthorized(handler) {
  onUnauthorizedHandler = handler
}

export function getRealtimeUrl() {
  return realtimeUrl
}

export function setToken(newToken) {
  token = newToken
}

export function clearToken() {
  token = null
}

export function getToken() {
  return token
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

/**
 * @param {string} path 例如 '/appointments'
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object} [options.body]
 * @param {object} [options.query]
 */
export async function request(path, { method = 'GET', body, query } = {}) {
  if (!baseUrl) {
    throw new Error('apiClient 尚未 configure()，請先設定 baseUrl')
  }

  const fullUrl = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
  const url = new URL(fullUrl)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    }
  }

  const headers = { 'Content-Type': 'application/json' }
  const hadToken = Boolean(token)
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const err = new ApiError(data?.error || `API 錯誤（${res.status}）`, res.status, data)
    if (res.status === 401 && hadToken && typeof onUnauthorizedHandler === 'function') {
      onUnauthorizedHandler(err)
    }
    throw err
  }

  return data
}

export const apiClient = {
  configure,
  setToken,
  clearToken,
  getToken,
  getRealtimeUrl,
  setOnUnauthorized,
  request
}
