import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import { Provider } from '@ant-design/react-native'
import { View, ActivityIndicator } from 'react-native'
import { configure } from '@app/core'

// App 啟動時設定一次 API base url，之後所有畫面透過 @app/core 呼叫 API
// 都會自動用這個設定，不需要每個畫面各自傳入。
configure({
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  realtimeUrl: process.env.EXPO_PUBLIC_REALTIME_URL
})

export default function RootLayout() {
  // antd-mobile-rn 的圖示（IconOutline/IconFill，例如空清單、箭頭）是用字型檔畫的，
  // Expo 專案要用 expo-font 載入，Web 上也是同一套字型檔，不需要另外處理。
  const [fontsLoaded] = useFonts({
    antoutline: require('@ant-design/icons-react-native/fonts/antoutline.ttf'),
    antfill: require('@ant-design/icons-react-native/fonts/antfill.ttf')
  })

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <Provider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </Provider>
  )
}
