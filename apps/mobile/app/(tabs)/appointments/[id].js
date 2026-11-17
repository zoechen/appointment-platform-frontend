import { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { List, Button, Modal, WhiteSpace } from '@ant-design/react-native'
import {
  useAuthStore,
  useAppointmentsStore,
  formatAppointmentStatus,
  toZonedDateAndTime
} from '@app/core'
import { AppointmentForm } from '../../../src/components/AppointmentForm.js'

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const timeZone = useAuthStore((state) => state.business?.TimeZone) || 'Asia/Taipei'
  const items = useAppointmentsStore((state) => state.items)
  const fetchAppointment = useAppointmentsStore((state) => state.fetchAppointment)
  const updateAppointment = useAppointmentsStore((state) => state.updateAppointment)
  const cancelAppointment = useAppointmentsStore((state) => state.cancelAppointment)

  const appointment = items.find((a) => a.AppointmentId === id)
  const [loading, setLoading] = useState(!appointment)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id || id === 'undefined' || id === 'new' || appointment) return
    setLoading(true)
    fetchAppointment(id)
      .catch((err) => Modal.alert('讀取失敗', err.message, [{ text: '知道了' }]))
      .finally(() => setLoading(false))
  }, [id, appointment, fetchAppointment])

  const initialFormValues = useMemo(() => {
    if (!appointment) return null
    const start = toZonedDateAndTime(appointment.StartTime, timeZone)
    const end = toZonedDateAndTime(appointment.EndTime, timeZone)
    return {
      title: appointment.Title,
      customerName: appointment.CustomerName || '',
      customerContact: appointment.CustomerContact || '',
      date: start.date,
      startTime: start.time,
      endTime: end.time
    }
  }, [appointment, timeZone])

  async function handleSave(values) {
    setSubmitting(true)
    try {
      await updateAppointment(id, values)
      setEditing(false)
    } catch (err) {
      Modal.alert('儲存失敗', err.message, [{ text: '知道了' }])
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    Modal.alert('取消預約', '確定要取消這筆預約嗎？', [
      { text: '不要' },
      {
        text: '確定取消',
        onPress: async () => {
          try {
            await cancelAppointment(id)
            router.back()
          } catch (err) {
            Modal.alert('取消失敗', err.message, [{ text: '知道了' }])
          }
        }
      }
    ])
  }

  if (loading || !appointment) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: true, title: '預約詳情' }} />
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: appointment.Title }} />
      <ScrollView contentContainerStyle={styles.content}>
        {editing ? (
          <AppointmentForm
            initialValues={initialFormValues}
            onSubmit={handleSave}
            submitLabel="儲存變更"
            submitting={submitting}
          />
        ) : (
          <View>
            <List renderHeader="預約資訊">
              <List.Item extra={formatAppointmentStatus(appointment.Status)}>狀態</List.Item>
              <List.Item extra={appointment.CustomerName || '—'}>客人</List.Item>
              <List.Item extra={appointment.CustomerContact || '—'}>手機</List.Item>
              <List.Item extra={appointment.Source === 'chatbot' ? '聊天機器人' : '手動建立'}>
                來源
              </List.Item>
            </List>

            <WhiteSpace size="lg" />
            <Button type="primary" onPress={() => setEditing(true)}>
              編輯
            </Button>
            {appointment.Status !== 'cancelled' && (
              <>
                <WhiteSpace />
                <Button type="warning" onPress={handleCancel}>
                  取消預約
                </Button>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' },
  content: { paddingVertical: 20, maxWidth: 480, width: '100%', alignSelf: 'center' }
})
