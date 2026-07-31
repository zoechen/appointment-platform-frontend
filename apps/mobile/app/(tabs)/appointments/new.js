import { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { Modal } from '@ant-design/react-native'
import { useAppointmentsStore } from '@app/core'
import { AppointmentForm } from '../../../src/components/AppointmentForm.js'

export default function NewAppointmentScreen() {
  const router = useRouter()
  const createAppointment = useAppointmentsStore((state) => state.createAppointment)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values) {
    setSubmitting(true)
    try {
      await createAppointment(values)
      router.back()
    } catch (err) {
      Modal.alert('建立失敗', err.message, [{ text: '知道了' }])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: '新增預約' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppointmentForm onSubmit={handleSubmit} submitLabel="建立預約" submitting={submitting} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { paddingVertical: 20, maxWidth: 480, width: '100%', alignSelf: 'center' }
})
