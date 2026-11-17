import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * 登入狀態持久化：
 * - 手機端（iOS / Android）優先使用加密儲存（SecureStore）存放敏感的 JWT token，
 *   非敏感的店家/員工顯示資訊存於 AsyncStorage；若執行環境尚未連結原生 SecureStore
 *   或處於 Web 環境，則自動退回 AsyncStorage（localStorage）。
 * - 讀取時會自動檢查 JWT 的 exp（到期時間），若已過期則自動清除，避免還原失效憑證。
 */
const SESSION_KEY = 'appointment-platform:session'
const TOKEN_SECURE_KEY = 'appointment-platform.jwt-token'

let customSecureStore = null

export function setSecureTokenStore(store) {
  customSecureStore = store
}

function getSecureStore() {
  if (customSecureStore) return customSecureStore
  if (Platform.OS === 'web') return null
  try {
    // 動態載入，避免在純 Web 或尚未安裝原生模組的環境下中斷打包
    const loader = typeof require === 'function' ? require : null
    if (!loader) return null
    const mod = loader('expo-secure-store')
    if (mod?.getItemAsync && mod?.setItemAsync && mod?.deleteItemAsync) {
      return mod
    }
  } catch {
    // 環境未安裝 expo-secure-store 時安全退回 AsyncStorage
  }
  return null
}

/**
 * 檢查 JWT payload 內的 exp 欄位是否已過期（不驗簽章，簽章由後端負責驗證）。
 */
export function isJwtExpired(token, nowMs = Date.now()) {
  if (!token || typeof token !== 'string') return true
  const parts = token.split('.')
  if (parts.length !== 3) return false
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8')
    const payload = JSON.parse(json)
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000 <= nowMs
    }
    return false
  } catch {
    return false
  }
}

export async function saveSession({ token, business, staff }) {
  const secureStore = getSecureStore()
  if (secureStore && token) {
    await secureStore.setItemAsync(TOKEN_SECURE_KEY, token)
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ business, staff }))
    return
  }
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token, business, staff }))
}

export async function loadSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    const secureStore = getSecureStore()
    const token = secureStore
      ? (await secureStore.getItemAsync(TOKEN_SECURE_KEY)) || parsed.token
      : parsed.token

    if (!token || isJwtExpired(token)) {
      await clearSession()
      return null
    }

    return { token, business: parsed.business || null, staff: parsed.staff || null }
  } catch {
    await clearSession()
    return null
  }
}

export async function clearSession() {
  const secureStore = getSecureStore()
  if (secureStore) {
    await secureStore.deleteItemAsync(TOKEN_SECURE_KEY).catch(() => {})
  }
  await AsyncStorage.removeItem(SESSION_KEY)
}
