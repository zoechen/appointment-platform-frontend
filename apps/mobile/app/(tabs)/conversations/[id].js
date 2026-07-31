import { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { Button, Toast, ActionSheet } from '@ant-design/react-native'
import { useConversationsStore, formatDateTime, formatPlatformName, isWithinMessagingWindow } from '@app/core'

function MessageBubble({ message }) {
  const isCustomer = message.SenderType === 'customer'
  return (
    <View style={[styles.bubbleRow, isCustomer ? styles.rowLeft : styles.rowRight]}>
      <View style={[styles.bubble, isCustomer ? styles.bubbleCustomer : styles.bubbleOurs]}>
        <Text style={styles.bubbleText}>{message.Content}</Text>
        <Text style={styles.bubbleTime}>{formatDateTime(message.CreatedAt)}</Text>
      </View>
    </View>
  )
}

function HeaderMenuButton({ onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.headerButton}>
      <Text style={styles.headerButtonText}>⋮</Text>
    </Pressable>
  )
}

export default function ConversationThreadScreen() {
  const { id } = useLocalSearchParams()
  const items = useConversationsStore((state) => state.items)
  const messagesByConversation = useConversationsStore((state) => state.messagesByConversation)
  const fetchMessages = useConversationsStore((state) => state.fetchMessages)
  const fetchConversation = useConversationsStore((state) => state.fetchConversation)
  const sendReply = useConversationsStore((state) => state.sendReply)
  const setConversationMode = useConversationsStore((state) => state.setConversationMode)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const messages = messagesByConversation[id] || []
  const conversation = items.find((c) => c.ConversationId === id)
  const mode = conversation?.Mode || 'bot' // 還沒讀到之前先當作預設值 bot，避免畫面閃爍
  const canSendFreeForm = conversation ? isWithinMessagingWindow(conversation, conversation.Platform) : true

  useEffect(() => {
    fetchMessages(id).catch((err) => Toast.fail(err.message))
    if (!conversation) {
      fetchConversation(id).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleSend() {
    if (!draft.trim()) return
    setSending(true)
    try {
      await sendReply(id, draft.trim())
      setDraft('')
    } catch (err) {
      Toast.fail(err.message)
    } finally {
      setSending(false)
    }
  }

  function handleOpenMenu() {
    const isBot = mode === 'bot'
    const options = [
      isBot ? '切換為人工回覆' : '切換為 Chatbot 自動回覆',
      '取消'
    ]

    ActionSheet.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        title: '對話設定'
      },
      async (buttonIndex) => {
        if (buttonIndex !== 0) return
        try {
          await setConversationMode(id, isBot ? 'human' : 'bot')
          Toast.success(isBot ? '已切換為人工回覆' : '已切換為 Chatbot 自動回覆')
        } catch (err) {
          Toast.fail(err.message)
        }
      }
    )
  }

  const headerTitle = conversation
    ? `${conversation.DisplayName || '未命名客人'} / ${formatPlatformName(conversation.Platform)}`
    : '對話'

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: headerTitle,
          headerRight: () => <HeaderMenuButton onPress={handleOpenMenu} />
        }}
      />

      <View style={styles.modeBanner}>
        <Text style={styles.modeBannerText}>
          {mode === 'human' ? '👤 目前為人工回覆，Chatbot 已暫停' : '🤖 目前由 Chatbot 自動回覆'}
        </Text>
      </View>

      {!canSendFreeForm && (
        <View style={styles.windowWarning}>
          <Text style={styles.windowWarningText}>
            ⚠️ 已超過 24 小時訊息視窗，Meta 規定此時無法主動回覆，需等客人再次傳訊
          </Text>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.MessageId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={canSendFreeForm ? '輸入回覆…' : '已超過 24 小時視窗，暫時無法傳送'}
          placeholderTextColor="#475569"
          editable={canSendFreeForm}
          multiline
        />
        <Button
          type="primary"
          loading={sending}
          disabled={!canSendFreeForm}
          onPress={handleSend}
          style={styles.sendButton}
        >
          送出
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  headerButton: { paddingHorizontal: 8, paddingVertical: 4 },
  headerButtonText: { fontSize: 20, color: '#F8FAFC', fontWeight: '700' },
  modeBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  modeBannerText: { color: '#94A3B8', fontSize: 12, textAlign: 'center' },
  windowWarning: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#451A03',
    borderBottomWidth: 1,
    borderBottomColor: '#78350F'
  },
  windowWarningText: { color: '#FCD34D', fontSize: 12, textAlign: 'center' },
  listContent: { padding: 16, maxWidth: 720, width: '100%', alignSelf: 'center' },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleCustomer: { backgroundColor: '#1E293B' },
  bubbleOurs: { backgroundColor: '#2563EB' },
  bubbleText: { color: '#F8FAFC', fontSize: 14 },
  bubbleTime: { color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center'
  },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    maxHeight: 100
  },
  sendButton: { width: 90 }
})
