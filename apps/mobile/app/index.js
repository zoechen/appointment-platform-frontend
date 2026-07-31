import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuthStore, selectIsAuthenticated } from '@app/core'
import { loadSession } from '../src/sessionStorage.js'

/**
 * App 的第一個畫面：嘗試從本機儲存還原登入狀態，
 * 還原完成前顯示 loading，完成後依是否登入導向對應畫面。
 */
export default function Index() {
  const [ready, setReady] = useState(false)
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    loadSession()
      .then((session) => {
        if (session?.token) hydrate(session)
      })
      .finally(() => setReady(true))
  }, [hydrate])

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/appointments' : '/login'} />
}
