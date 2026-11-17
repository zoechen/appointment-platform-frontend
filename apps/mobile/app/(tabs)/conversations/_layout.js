import { Stack } from 'expo-router'

export default function ConversationsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F8FAFC',
        contentStyle: { backgroundColor: '#0F172A' }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: '對話' }} />
    </Stack>
  )
}
