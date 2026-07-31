import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { Card, WhiteSpace } from '@ant-design/react-native'
import { useAppointmentsStore, formatTimeRange, formatAppointmentStatus } from '@app/core'
import { useResponsive } from '../../../src/useResponsive.js'

const STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#22C55E',
  cancelled: '#94A3B8',
  completed: '#3B82F6'
}

function AppointmentCard({ appointment, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <Card.Header
          title={
            <Text style={styles.cardTitle} numberOfLines={1}>
              {appointment.Title}
            </Text>
          }
          extra={
            <View
              style={[
                styles.badge,
                { backgroundColor: STATUS_COLORS[appointment.Status] || '#64748B' }
              ]}
            >
              <Text style={styles.badgeText}>{formatAppointmentStatus(appointment.Status)}</Text>
            </View>
          }
        />
        <Card.Body style={styles.cardBody}>
          <Text style={styles.cardTime}>
            {formatTimeRange(appointment.StartTime, appointment.EndTime)}
          </Text>
          {appointment.CustomerName ? (
            <Text style={styles.cardCustomer}>客人：{appointment.CustomerName}</Text>
          ) : null}
        </Card.Body>
      </Card>
    </Pressable>
  )
}

export default function AppointmentsScreen() {
  const router = useRouter()
  const { columns } = useResponsive()
  const items = useAppointmentsStore((state) => state.items)
  const status = useAppointmentsStore((state) => state.status)
  const fetchAppointments = useAppointmentsStore((state) => state.fetchAppointments)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchAppointments().catch(() => {})
    setRefreshing(false)
  }, [fetchAppointments])

  const sorted = [...items].sort((a, b) => new Date(a.StartTime) - new Date(b.StartTime))

  return (
    <View style={styles.container}>
      <FlatList
        key={columns} // 欄數改變時要強制重新排版，這是 RN FlatList numColumns 的已知限制
        data={sorted}
        keyExtractor={(item) => item.AppointmentId}
        numColumns={columns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, { flexBasis: `${100 / columns}%` }]}>
            <AppointmentCard
              appointment={item}
              onPress={() => router.push(`/(tabs)/appointments/${item.AppointmentId}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          status === 'loaded' ? <Text style={styles.empty}>目前還沒有任何預約</Text> : null
        }
      />

      <WhiteSpace />
      <Pressable style={styles.fab} onPress={() => router.push('/(tabs)/appointments/new')}>
        <Text style={styles.fabText}>＋ 新增預約</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  listContent: { padding: 16, paddingBottom: 96 },
  row: { gap: 12 },
  cardWrapper: { padding: 6 },
  card: { backgroundColor: '#111827', borderColor: '#1E293B' },
  cardBody: { paddingTop: 4 },
  cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  cardTime: { color: '#94A3B8', fontSize: 13 },
  cardCustomer: { color: '#64748B', fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { color: '#0B1120', fontSize: 11, fontWeight: '700' },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 48 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999
  },
  fabText: { color: '#fff', fontWeight: '700' }
})
