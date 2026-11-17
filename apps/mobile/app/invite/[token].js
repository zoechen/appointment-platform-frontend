import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { List, InputItem, Button, WhiteSpace } from '@ant-design/react-native'
import { useStaffStore, useAuthStore } from '@app/core'
import { saveSession } from '../../src/sessionStorage.js'

/**
 * 公開的店員邀請接受頁面（/invite/[token]）。
 * 受邀人點開負責人傳送的連結後：
 * 1. 先呼叫 GET /invitations/:token 預覽店家名稱與受邀 Email（並觸發後端寫入 FirstViewedAt）
 * 2. 填寫顯示名稱與密碼，呼叫 POST /invitations/:token/accept 完成註冊並直接進入系統
 */
export default function AcceptInviteScreen() {
  const { token } = useLocalSearchParams()
  const router = useRouter()
  const previewInvitation = useStaffStore((state) => state.previewInvitation)
  const acceptInvitation = useStaffStore((state) => state.acceptInvitation)
  const hydrate = useAuthStore((state) => state.hydrate)

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('缺少邀請連結憑證')
      setLoading(false)
      return
    }
    previewInvitation(String(token))
      .then((inv) => {
        setInvitation(inv)
        if (inv.Status !== 'pending') {
          setError(
            inv.Status === 'expired'
              ? '這張邀請連結已過期，請聯絡店家負責人重新發送'
              : inv.Status === 'revoked'
                ? '這張邀請已被店家負責人撤回'
                : '這張邀請連結已經使用過了'
          )
        }
      })
      .catch((err) => {
        setError(err.message || '找不到這張邀請或連結已失效')
      })
      .finally(() => setLoading(false))
  }, [token, previewInvitation])

  async function handleAccept() {
    if (!displayName.trim() || !password) {
      setError('請填寫您的姓名與密碼')
      return
    }
    if (password.length < 8) {
      setError('密碼至少需要 8 個字元')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const data = await acceptInvitation(String(token), {
        displayName: displayName.trim(),
        password
      })
      hydrate(data)
      await saveSession(data)
      router.replace('/(tabs)/appointments')
    } catch (err) {
      setError(err.message || '接受邀請失敗')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>加入店家團隊</Text>
        {invitation ? (
          <Text style={styles.subtitle}>
            「{invitation.BusinessName}」邀請您以店員身分加入（{invitation.Email}）
          </Text>
        ) : null}

        <WhiteSpace size="lg" />

        {invitation?.Status === 'pending' ? (
          <>
            <List style={styles.fullWidth}>
              <InputItem
                clear
                value={displayName}
                onChange={setDisplayName}
                placeholder="例如：陳小華"
              >
                您的姓名
              </InputItem>
              <InputItem
                clear
                type="password"
                autoCapitalize="none"
                value={password}
                onChange={setPassword}
                placeholder="至少 8 個字元"
              >
                設定密碼
              </InputItem>
            </List>
            <WhiteSpace size="lg" />
            <View style={styles.fullWidth}>
              <Button type="primary" loading={submitting} onPress={handleAccept}>
                接受邀請並登入
              </Button>
            </View>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <WhiteSpace size="lg" />
        <Text style={styles.linkText} onPress={() => router.replace('/login')}>
          返回登入頁
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center'
  },
  fullWidth: { width: '100%' },
  title: { color: '#F8FAFC', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  error: { color: '#F87171', marginTop: 16, fontSize: 13, textAlign: 'center' },
  linkText: { color: '#60A5FA', fontSize: 13, textAlign: 'center' }
})
