import { Stack } from 'expo-router'

export default function AppointmentsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F8FAFC',
        contentStyle: { backgroundColor: '#0F172A' }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: '新增預約' }} />
      <Stack.Screen name="[id]" options={{ title: '預約詳情' }} />
    </Stack>
  )
}
