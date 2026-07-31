import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useRealtimeSync } from '../../src/useRealtimeSync.js'

function TabIcon({ label, focused }) {
  return (
    <Text style={{ fontSize: 12, color: focused ? '#2563EB' : '#94A3B8' }}>{label}</Text>
  )
}

// 分頁順序／命名對齊設計稿：對話 → 預約 → 帳號
// （帳號頁把原本獨立的「通路綁定」分頁併進去了，見 app/(tabs)/account/index.js）
export default function TabsLayout() {
  useRealtimeSync()

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F8FAFC',
        tabBarStyle: { backgroundColor: '#0F172A', borderTopColor: '#1E293B' },
        tabBarShowLabel: false
      }}
    >
      <Tabs.Screen
        name="conversations"
        options={{
          title: '對話',
          tabBarIcon: ({ focused }) => <TabIcon label="💬 對話" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: '預約',
          tabBarIcon: ({ focused }) => <TabIcon label="📅 預約" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: '帳號',
          tabBarIcon: ({ focused }) => <TabIcon label="👤 帳號" focused={focused} />
        }}
      />
    </Tabs>
  )
}
