import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { List, InputItem, Button, WhiteSpace } from '@ant-design/react-native'
import { useAuthStore } from '@app/core'
import { saveSession } from '../src/sessionStorage.js'

// Web 上完成 OAuth 後要呼叫這個，讓彈出的驗證視窗知道流程結束了。
WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const router = useRouter()
  const status = useAuthStore((state) => state.status)
  const error = useAuthStore((state) => state.error)
  const loginWithGoogleIdToken = useAuthStore((state) => state.loginWithGoogleIdToken)
  const loginWithPassword = useAuthStore((state) => state.loginWithPassword)
  const registerWithPassword = useAuthStore((state) => state.registerWithPassword)
  const authState = useAuthStore((state) => ({
    business: state.business,
    staff: state.staff,
    token: state.token
  }))

  // mode: 'login' 或 'register'，切換要不要多顯示「姓名」欄位
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  // Google 登入先當成次要選項保留：跟後端 /auth/google 的合約一致
  // （後端要驗證 id_token 的簽章）。三個平台各自要在 Google Cloud Console
  // 建立對應的 OAuth Client ID，見 apps/mobile/.env.example 的說明。
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    responseType: 'id_token',
    scopes: ['openid', 'profile', 'email']
  })

  useEffect(() => {
    if (response?.type !== 'success') return
    const idToken = response.params?.id_token
    if (!idToken) return

    loginWithGoogleIdToken(idToken).catch(() => {
      // 錯誤已經存在 authStore.error，畫面上會顯示，這裡不用額外處理
    })
  }, [response, loginWithGoogleIdToken])

  useEffect(() => {
    if (status === 'authenticated' && authState.token) {
      saveSession(authState).then(() => router.replace('/(tabs)/appointments'))
    }
  }, [status, authState, router])

  function handleSubmit() {
    if (mode === 'login') {
      loginWithPassword({ email: email.trim(), password }).catch(() => {})
    } else {
      registerWithPassword({ email: email.trim(), password, name: name.trim() }).catch(() => {})
    }
  }

  const isLogin = mode === 'login'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>預約管理</Text>
        <Text style={styles.subtitle}>{isLogin ? '登入你的帳號' : '建立一個新帳號'}</Text>

        <WhiteSpace size="lg" />

        <List style={styles.fullWidth}>
          {!isLogin && (
            <InputItem clear value={name} onChange={setName} placeholder="例如：王小明">
              姓名
            </InputItem>
          )}
          <InputItem
            clear
            autoCapitalize="none"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          >
            Email
          </InputItem>
          <InputItem
            clear
            type="password"
            autoCapitalize="none"
            value={password}
            onChange={setPassword}
            placeholder={isLogin ? '輸入密碼' : '至少 8 個字元'}
          >
            密碼
          </InputItem>
        </List>

        <WhiteSpace size="lg" />
        <View style={styles.fullWidth}>
          <Button type="primary" loading={status === 'loading'} onPress={handleSubmit}>
            {isLogin ? '登入' : '註冊'}
          </Button>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <WhiteSpace size="lg" />
        <Text style={styles.switchText} onPress={() => setMode(isLogin ? 'register' : 'login')}>
          {isLogin ? '還沒有帳號？點此註冊' : '已經有帳號了？點此登入'}
        </Text>

        <WhiteSpace size="lg" />
        <View style={styles.divider} />
        <WhiteSpace />

        <Text
          style={[styles.switchText, !request && styles.disabledText]}
          onPress={() => request && promptAsync()}
        >
          或使用 Google 帳號登入
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 20px 40px rgba(0,0,0,0.35)' } : {})
  },
  fullWidth: { width: '100%' },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14
  },
  error: {
    color: '#F87171',
    marginTop: 16,
    fontSize: 13,
    textAlign: 'center'
  },
  switchText: {
    color: '#60A5FA',
    fontSize: 13,
    textAlign: 'center'
  },
  disabledText: {
    color: '#475569'
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#1E293B'
  }
})
