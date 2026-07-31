import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * AsyncStorage 在 iOS/Android 用原生儲存，在 Web 會自動 fallback 成 localStorage，
 * 所以這支工具可以直接在三個平台共用，不需要另外判斷平台。
 */
const KEY = 'appointment-platform:session'

export async function saveSession({ token, business, staff }) {
  await AsyncStorage.setItem(KEY, JSON.stringify({ token, business, staff }))
}

export async function loadSession() {
  const raw = await AsyncStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : null
}

export async function clearSession() {
  await AsyncStorage.removeItem(KEY)
}
