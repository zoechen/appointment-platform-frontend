import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { List, InputItem, Button, Modal, Toast, WhiteSpace } from '@ant-design/react-native'
import { useChannelsStore, useAuthStore, formatPlatformName } from '@app/core'
import { clearSession } from '../../../src/sessionStorage.js'

function ProfileHeader() {
  const business = useAuthStore((state) => state.business)
  const staff = useAuthStore((state) => state.staff)
  const displayName = staff?.DisplayName || business?.Name || '使用者'
  const initial = displayName.trim().charAt(0).toUpperCase()

  return (
    <View style={styles.profile}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.profileName}>{displayName}</Text>
      {business?.Email ? <Text style={styles.profileEmail}>{business.Email}</Text> : null}
    </View>
  )
}

export default function AccountScreen() {
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  const items = useChannelsStore((state) => state.items)
  const fetchChannels = useChannelsStore((state) => state.fetchChannels)
  const getFacebookConnectUrl = useChannelsStore((state) => state.getFacebookConnectUrl)
  const bindLineChannel = useChannelsStore((state) => state.bindLineChannel)
  const removeChannel = useChannelsStore((state) => state.removeChannel)

  const [lineSecret, setLineSecret] = useState('')
  const [lineToken, setLineToken] = useState('')
  const [bindingLine, setBindingLine] = useState(false)
  const [connectingFb, setConnectingFb] = useState(false)

  useEffect(() => {
    fetchChannels().catch(() => {})
  }, [fetchChannels])

  async function handleConnectFacebook() {
    setConnectingFb(true)
    try {
      const url = await getFacebookConnectUrl()
      // 開系統瀏覽器/WebView 完成 OAuth，完成後使用者手動切回 App，
      // 這裡簡化處理：回來後可以下拉重新整理清單看到新綁定的通路。
      await WebBrowser.openBrowserAsync(url)
    } catch (err) {
      Modal.alert('無法開始綁定', err.message, [{ text: '知道了' }])
    } finally {
      setConnectingFb(false)
    }
  }

  async function handleBindLine() {
    if (!lineSecret || !lineToken) {
      Toast.info('請填寫完整的 Channel Secret 與 Channel Access Token')
      return
    }
    setBindingLine(true)
    try {
      await bindLineChannel({ channelSecret: lineSecret, channelAccessToken: lineToken })
      setLineSecret('')
      setLineToken('')
      Toast.success('LINE 官方帳號已綁定完成')
    } catch (err) {
      Modal.alert('綁定失敗', err.message, [{ text: '知道了' }])
    } finally {
      setBindingLine(false)
    }
  }

  function handleRemove(channelId) {
    Modal.alert('解除綁定', '確定要解除這個通路的綁定嗎？', [
      { text: '取消' },
      { text: '確定', onPress: () => removeChannel(channelId) }
    ])
  }

  function handleLogout() {
    Modal.alert('登出', '確定要登出嗎？', [
      { text: '取消' },
      {
        text: '登出',
        onPress: async () => {
          logout()
          await clearSession()
          router.replace('/login')
        }
      }
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ProfileHeader />

      <WhiteSpace size="lg" />

      <List renderHeader="已綁定的通路">
        {items.length === 0 ? (
          <List.Item>
            <Text style={styles.empty}>目前還沒有綁定任何通路</Text>
          </List.Item>
        ) : (
          items.map((channel) => (
            <List.Item
              key={channel.ChannelId}
              extra={channel.Status === 'active' ? '已連結' : channel.Status}
              onPress={() => handleRemove(channel.ChannelId)}
            >
              {channel.DisplayName || channel.ExternalAccountId}
              <List.Item.Brief>{formatPlatformName(channel.Platform)}（點擊解除綁定）</List.Item.Brief>
            </List.Item>
          ))
        )}
      </List>

      <WhiteSpace size="lg" />

      <List renderHeader="綁定 Facebook / Instagram">
        <List.Item wrap>
          <Text style={styles.hint}>
            會開啟瀏覽器完成 Facebook 授權，若粉專有連結 IG 專業帳號會一併綁定。
          </Text>
        </List.Item>
      </List>
      <WhiteSpace />
      <Button type="primary" loading={connectingFb} onPress={handleConnectFacebook}>
        一鍵綁定 Facebook / Instagram
      </Button>

      <WhiteSpace size="lg" />

      <List renderHeader="綁定 LINE">
        <List.Item wrap>
          <Text style={styles.hint}>
            請先到 LINE Developers 後台建立 Messaging API Channel，取得 Channel Secret 與
            Channel Access Token 後貼在這裡。
          </Text>
        </List.Item>
        <InputItem clear value={lineSecret} onChange={setLineSecret} placeholder="貼上">
          Channel Secret
        </InputItem>
        <InputItem clear value={lineToken} onChange={setLineToken} placeholder="貼上">
          Access Token
        </InputItem>
      </List>
      <WhiteSpace />
      <Button loading={bindingLine} onPress={handleBindLine}>
        綁定 LINE 官方帳號
      </Button>

      <WhiteSpace size="lg" />
      <Button type="warning" onPress={handleLogout}>
        登出
      </Button>
      <WhiteSpace size="lg" />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { maxWidth: 560, width: '100%', alignSelf: 'center', padding: 4 },
  profile: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  profileName: { color: '#F8FAFC', fontSize: 17, fontWeight: '700' },
  profileEmail: { color: '#64748B', fontSize: 13, marginTop: 2 },
  empty: { color: '#64748B', fontSize: 13 },
  hint: { color: '#64748B', fontSize: 12, lineHeight: 18 }
})
