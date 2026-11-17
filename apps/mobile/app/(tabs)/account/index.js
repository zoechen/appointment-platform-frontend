import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, AppState } from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { List, InputItem, Button, Modal, Toast, WhiteSpace } from '@ant-design/react-native'
import {
  useChannelsStore,
  useAuthStore,
  useStaffStore,
  formatPlatformName
} from '@app/core'
import { clearSession } from '../../../src/sessionStorage.js'

function ProfileHeader() {
  const business = useAuthStore((state) => state.business)
  const staff = useAuthStore((state) => state.staff)
  const displayName = staff?.DisplayName || business?.Name || '使用者'
  const initial = displayName.trim().charAt(0).toUpperCase()
  const roleLabel = staff?.Role === 'owner' ? '店家負責人' : '店員'

  return (
    <View style={styles.profile}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.profileName}>{displayName}</Text>
      <Text style={styles.roleBadge}>{roleLabel}</Text>
      {business?.Email ? <Text style={styles.profileEmail}>{business.Email}</Text> : null}
    </View>
  )
}

export default function AccountScreen() {
  const router = useRouter()
  const currentStaff = useAuthStore((state) => state.staff)
  const isOwner = currentStaff?.Role === 'owner'
  const logout = useAuthStore((state) => state.logout)

  const items = useChannelsStore((state) => state.items)
  const pendingPages = useChannelsStore((state) => state.pendingPages)
  const fetchChannels = useChannelsStore((state) => state.fetchChannels)
  const fetchPendingFacebookPages = useChannelsStore((state) => state.fetchPendingFacebookPages)
  const finalizeFacebookPages = useChannelsStore((state) => state.finalizeFacebookPages)
  const getFacebookConnectUrl = useChannelsStore((state) => state.getFacebookConnectUrl)
  const bindLineChannel = useChannelsStore((state) => state.bindLineChannel)
  const removeChannel = useChannelsStore((state) => state.removeChannel)

  const staffList = useStaffStore((state) => state.staff)
  const invitations = useStaffStore((state) => state.invitations)
  const seats = useStaffStore((state) => state.seats)
  const fetchStaff = useStaffStore((state) => state.fetchStaff)
  const createInvitation = useStaffStore((state) => state.createInvitation)
  const revokeInvitation = useStaffStore((state) => state.revokeInvitation)
  const updateStaff = useStaffStore((state) => state.updateStaff)

  const [lineSecret, setLineSecret] = useState('')
  const [lineToken, setLineToken] = useState('')
  const [bindingLine, setBindingLine] = useState(false)
  const [connectingFb, setConnectingFb] = useState(false)
  const [selectedPageIds, setSelectedPageIds] = useState([])
  const [bindInstagram, setBindInstagram] = useState(true)
  const [finalizingFb, setFinalizingFb] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [lastInviteUrl, setLastInviteUrl] = useState('')

  const refreshAccountData = useCallback(async () => {
    await fetchChannels().catch(() => {})
    if (isOwner) {
      const pages = await fetchPendingFacebookPages().catch(() => [])
      if (pages.length > 0) {
        setSelectedPageIds(pages.map((p) => p.id))
      }
      await fetchStaff().catch(() => {})
    }
  }, [fetchChannels, fetchPendingFacebookPages, fetchStaff, isOwner])

  useEffect(() => {
    refreshAccountData()
  }, [refreshAccountData])

  // 當使用者從外部瀏覽器完成 Facebook OAuth 回到 App 前景時，自動重新整理通路與待選粉專清單
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshAccountData()
      }
    })
    return () => subscription.remove()
  }, [refreshAccountData])

  async function handleConnectFacebook() {
    setConnectingFb(true)
    try {
      const url = await getFacebookConnectUrl({ select: true })
      await WebBrowser.openBrowserAsync(url)
      // 瀏覽器關閉或切回時自動刷新，不需手動下拉重整
      await refreshAccountData()
    } catch (err) {
      Modal.alert('無法開始綁定', err.message, [{ text: '知道了' }])
    } finally {
      setConnectingFb(false)
    }
  }

  function togglePageSelection(pageId) {
    setSelectedPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
    )
  }

  async function handleFinalizeFacebook() {
    if (selectedPageIds.length === 0) {
      Toast.info('請至少勾選一個粉絲專頁')
      return
    }
    setFinalizingFb(true)
    try {
      await finalizeFacebookPages({ pageIds: selectedPageIds, bindInstagram })
      setSelectedPageIds([])
      Toast.success('已完成選定粉專的綁定')
    } catch (err) {
      Modal.alert('綁定失敗', err.message, [{ text: '知道了' }])
    } finally {
      setFinalizingFb(false)
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
    if (!isOwner) return
    Modal.alert('解除綁定', '確定要解除這個通路的綁定嗎？', [
      { text: '取消' },
      { text: '確定', onPress: () => removeChannel(channelId) }
    ])
  }

  async function handleCreateInvite() {
    if (!inviteEmail.trim()) {
      Toast.info('請輸入受邀店員的 Email')
      return
    }
    setCreatingInvite(true)
    try {
      const data = await createInvitation(inviteEmail.trim())
      setInviteEmail('')
      setLastInviteUrl(data.inviteUrl || `/invite/${data.token}`)
      Toast.success('已建立邀請連結')
    } catch (err) {
      Modal.alert('無法建立邀請', err.message, [{ text: '知道了' }])
    } finally {
      setCreatingInvite(false)
    }
  }

  function handleToggleStaffDisabled(member) {
    if (member.Role === 'owner') return
    const nextDisabled = !member.IsDisabled
    Modal.alert(
      nextDisabled ? '停用店員帳號' : '重新啟用店員帳號',
      nextDisabled
        ? `確定要停用「${member.DisplayName}」嗎？停用後該店員將立即登出且釋出名額。`
        : `確定要重新啟用「${member.DisplayName}」嗎？（會消耗 1 個店員名額）`,
      [
        { text: '取消' },
        {
          text: '確定',
          onPress: () =>
            updateStaff(member.StaffId, { isDisabled: nextDisabled }).catch((err) => {
              Modal.alert('操作失敗', err.message, [{ text: '知道了' }])
            })
        }
      ]
    )
  }

  function handleRevokeInvitation(invitation) {
    Modal.alert('撤回邀請', `確定要撤回寄給 ${invitation.Email} 的邀請連結嗎？`, [
      { text: '取消' },
      {
        text: '確定撤回',
        onPress: () =>
          revokeInvitation(invitation.InvitationId).catch((err) => {
            Modal.alert('撤回失敗', err.message, [{ text: '知道了' }])
          })
      }
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

  const pendingInvitations = invitations.filter((inv) => inv.Status === 'pending')

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
              onPress={isOwner ? () => handleRemove(channel.ChannelId) : undefined}
            >
              {channel.DisplayName || channel.ExternalAccountId}
              <List.Item.Brief>
                {formatPlatformName(channel.Platform)}
                {isOwner ? '（點擊解除綁定）' : ''}
              </List.Item.Brief>
            </List.Item>
          ))
        )}
      </List>

      {isOwner && pendingPages.length > 0 && (
        <>
          <WhiteSpace size="lg" />
          <List renderHeader="勾選要綁定的 Facebook 粉專／Instagram">
            {pendingPages.map((page) => {
              const checked = selectedPageIds.includes(page.id)
              return (
                <List.Item
                  key={page.id}
                  extra={checked ? '✅ 已選取' : '⬜ 未選取'}
                  onPress={() => togglePageSelection(page.id)}
                >
                  {page.name}
                  <List.Item.Brief>
                    {page.instagramBusinessAccount
                      ? '已連結 Instagram 專業帳號'
                      : '僅 Facebook 粉專'}
                  </List.Item.Brief>
                </List.Item>
              )
            })}
            <List.Item
              extra={bindInstagram ? '✅ 一併綁定' : '⬜ 不綁定'}
              onPress={() => setBindInstagram((v) => !v)}
            >
              自動綁定連結的 Instagram 專業帳號
            </List.Item>
          </List>
          <WhiteSpace />
          <Button type="primary" loading={finalizingFb} onPress={handleFinalizeFacebook}>
            確認綁定選定的粉專
          </Button>
        </>
      )}

      {isOwner && (
        <>
          <WhiteSpace size="lg" />

          <List renderHeader="綁定 Facebook / Instagram">
            <List.Item wrap>
              <Text style={styles.hint}>
                會開啟瀏覽器完成 Facebook 授權，完成後回到 App 會自動更新清單；若管理多個粉專可勾選要綁定的項目。
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

          <List
            renderHeader={`店員管理與邀請${
              seats ? `（已用名額 ${seats.used} / ${seats.max}）` : ''
            }`}
          >
            {staffList.map((member) => (
              <List.Item
                key={member.StaffId}
                extra={
                  member.Role === 'owner'
                    ? '負責人'
                    : member.IsDisabled
                      ? '已停用（點擊啟用）'
                      : '啟用中（點擊停用）'
                }
                onPress={
                  member.Role !== 'owner' ? () => handleToggleStaffDisabled(member) : undefined
                }
              >
                {member.DisplayName}
                <List.Item.Brief>{member.Email}</List.Item.Brief>
              </List.Item>
            ))}

            {pendingInvitations.map((inv) => (
              <List.Item
                key={inv.InvitationId}
                extra="待接受（點擊撤回）"
                onPress={() => handleRevokeInvitation(inv)}
              >
                {inv.Email}
                <List.Item.Brief>
                  {inv.FirstViewedAt ? '對方已開啟連結' : '尚未開啟連結'}
                </List.Item.Brief>
              </List.Item>
            ))}

            <InputItem
              clear
              autoCapitalize="none"
              value={inviteEmail}
              onChange={setInviteEmail}
              placeholder="staff@example.com"
            >
              邀請信箱
            </InputItem>
          </List>
          {lastInviteUrl ? (
            <View style={styles.inviteBox}>
              <Text style={styles.inviteTitle}>請複製以下單次邀請連結傳給店員（72 小時內有效）：</Text>
              <Text selectable style={styles.inviteUrl}>
                {lastInviteUrl}
              </Text>
            </View>
          ) : null}
          <WhiteSpace />
          <Button
            loading={creatingInvite}
            disabled={seats ? seats.available <= 0 : false}
            onPress={handleCreateInvite}
          >
            {seats && seats.available <= 0 ? '店員名額已滿' : '產生店員邀請連結'}
          </Button>
        </>
      )}

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
  roleBadge: {
    color: '#93C5FD',
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: '#1E3A8A',
    borderRadius: 10
  },
  profileEmail: { color: '#64748B', fontSize: 13, marginTop: 4 },
  empty: { color: '#64748B', fontSize: 13 },
  hint: { color: '#64748B', fontSize: 12, lineHeight: 18 },
  inviteBox: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginHorizontal: 8
  },
  inviteTitle: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
  inviteUrl: { color: '#60A5FA', fontSize: 13, fontWeight: '600' }
})
