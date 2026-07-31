import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { List } from '@ant-design/react-native'
import { useConversationsStore, formatPlatformName, formatDateTime } from '@app/core'

const PLATFORM_COLORS = { facebook: '#1877F2', instagram: '#E1306C', line: '#06C755' }

function ConversationRow({ conversation, onPress }) {
  return (
    <List.Item
      arrow="horizontal"
      onPress={onPress}
      thumb={
        <View
          style={[
            styles.platformDot,
            { backgroundColor: PLATFORM_COLORS[conversation.Platform] || '#64748B' }
          ]}
        />
      }
      extra={conversation.LastMessageAt ? formatDateTime(conversation.LastMessageAt) : ''}
    >
      {conversation.DisplayName || '未命名客人'}
      <List.Item.Brief>
        {formatPlatformName(conversation.Platform)}
        {conversation.Mode === 'human' ? '　·　👤 人工回覆中' : ''}
      </List.Item.Brief>
    </List.Item>
  )
}

export default function ConversationsScreen() {
  const router = useRouter()
  const items = useConversationsStore((state) => state.items)
  const status = useConversationsStore((state) => state.status)
  const fetchConversations = useConversationsStore((state) => state.fetchConversations)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchConversations().catch(() => {})
    setRefreshing(false)
  }, [fetchConversations])

  const sorted = [...items].sort(
    (a, b) => new Date(b.LastMessageAt || 0) - new Date(a.LastMessageAt || 0)
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.ConversationId}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            onPress={() => router.push(`/(tabs)/conversations/${item.ConversationId}`)}
          />
        )}
        ListEmptyComponent={
          status === 'loaded' ? <Text style={styles.empty}>目前還沒有任何對話</Text> : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  listContent: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  platformDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 48 }
})
