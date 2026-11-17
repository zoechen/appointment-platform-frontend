import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { List, InputItem, Button, WhiteSpace } from '@ant-design/react-native'
import { useAuthStore, zonedDateTimeToIso, toZonedDateAndTime } from '@app/core'

const QUICK_TIMES = [
  '09:00', '10:00', '11:00', '13:00',
  '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
]

function addMinutesToTimeStr(timeStr, minutesToAdd = 60) {
  const match = String(timeStr || '').match(/^(\d{2}):(\d{2})$/)
  if (!match) return ''
  const totalMinutes = Number(match[1]) * 60 + Number(match[2]) + minutesToAdd
  const clamped = Math.min(23 * 60 + 59, Math.max(0, totalMinutes))
  const h = String(Math.floor(clamped / 60)).padStart(2, '0')
  const m = String(clamped % 60).padStart(2, '0')
  return `${h}:${m}`
}

function getDateOffsetInZone(daysOffset, timeZone = 'Asia/Taipei', baseDateStr = '') {
  let baseMs = Date.now()
  if (/^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)) {
    const iso = zonedDateTimeToIso(baseDateStr, '12:00', timeZone)
    if (iso) baseMs = new Date(iso).getTime()
  }
  const targetIso = new Date(baseMs + daysOffset * 24 * 60 * 60 * 1000).toISOString()
  return toZonedDateAndTime(targetIso, timeZone).date
}

/**
 * 跨平台（iOS / Android / Web）預約表單：
 * - 提供互動式「快速日期選擇器（今天／明天／後天／前後日切換）」與「快速時段按鈕」，
 *   同時保留文字輸入彈性，在手機與網頁端都有一致且流暢的操作體驗。
 * - 時區處理：統一依據店家設定的時區（business.TimeZone，預設 Asia/Taipei）
 *   將輸入的當地日期時間換算為標準 UTC ISO 字串送給後端。
 */
export function AppointmentForm({ initialValues, onSubmit, submitLabel = '儲存', submitting }) {
  const timeZone = useAuthStore((state) => state.business?.TimeZone) || 'Asia/Taipei'
  const [title, setTitle] = useState(initialValues?.title || '')
  const [customerName, setCustomerName] = useState(initialValues?.customerName || '')
  const [customerContact, setCustomerContact] = useState(initialValues?.customerContact || '')
  const [date, setDate] = useState(
    initialValues?.date || getDateOffsetInZone(0, timeZone)
  )
  const [startTime, setStartTime] = useState(initialValues?.startTime || '14:00')
  const [endTime, setEndTime] = useState(initialValues?.endTime || '15:00')
  const [error, setError] = useState('')

  function handleQuickStartTime(slot) {
    setStartTime(slot)
    setEndTime(addMinutesToTimeStr(slot, 60))
  }

  function handleSubmit() {
    if (!title || !date || !startTime || !endTime) {
      setError('請填寫標題、日期與起訖時間')
      return
    }
    const startIso = zonedDateTimeToIso(date, startTime, timeZone)
    const endIso = zonedDateTimeToIso(date, endTime, timeZone)
    if (!startIso || !endIso) {
      setError('日期或時間格式不正確（請使用 YYYY-MM-DD 與 HH:mm 格式）')
      return
    }
    if (new Date(startIso) >= new Date(endIso)) {
      setError('開始時間必須早於結束時間')
      return
    }
    setError('')
    onSubmit({
      title,
      customerName: customerName || undefined,
      customerContact: customerContact || undefined,
      startTime: startIso,
      endTime: endIso
    })
  }

  return (
    <>
      <List renderHeader="預約資訊">
        <InputItem clear value={title} onChange={setTitle} placeholder="例如：諮詢會議">
          標題
        </InputItem>
        <InputItem clear value={customerName} onChange={setCustomerName} placeholder="選填">
          客人姓名
        </InputItem>
        <InputItem clear value={customerContact} onChange={setCustomerContact} placeholder="0912345678（選填）">
          手機
        </InputItem>
      </List>
      <Text style={styles.hint}>填手機可以把客人在 LINE / FB / IG 的預約紀錄串在一起</Text>

      <WhiteSpace size="lg" />

      <List renderHeader={`時間（時區：${timeZone}）`}>
        <InputItem clear value={date} onChange={setDate} placeholder="2026-08-05">
          日期
        </InputItem>
        <View style={styles.chipRow}>
          {[
            { label: '今天', val: getDateOffsetInZone(0, timeZone) },
            { label: '明天', val: getDateOffsetInZone(1, timeZone) },
            { label: '後天', val: getDateOffsetInZone(2, timeZone) },
            { label: '◀ 前一天', val: getDateOffsetInZone(-1, timeZone, date) },
            { label: '後一天 ▶', val: getDateOffsetInZone(1, timeZone, date) }
          ].map((btn) => (
            <Pressable
              key={btn.label}
              onPress={() => setDate(btn.val)}
              style={[styles.chip, date === btn.val && styles.chipActive]}
            >
              <Text style={[styles.chipText, date === btn.val && styles.chipTextActive]}>
                {btn.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <InputItem clear value={startTime} onChange={setStartTime} placeholder="14:00">
          開始時間
        </InputItem>
        <View style={styles.chipRow}>
          {QUICK_TIMES.map((slot) => (
            <Pressable
              key={slot}
              onPress={() => handleQuickStartTime(slot)}
              style={[styles.chip, startTime === slot && styles.chipActive]}
            >
              <Text style={[styles.chipText, startTime === slot && styles.chipTextActive]}>
                {slot}
              </Text>
            </Pressable>
          ))}
        </View>

        <InputItem clear value={endTime} onChange={setEndTime} placeholder="15:00">
          結束時間
        </InputItem>
        <View style={styles.chipRow}>
          {[
            { label: '+30 分鐘', mins: 30 },
            { label: '+60 分鐘', mins: 60 },
            { label: '+90 分鐘', mins: 90 },
            { label: '+120 分鐘', mins: 120 }
          ].map((dur) => {
            const targetEnd = addMinutesToTimeStr(startTime, dur.mins)
            return (
              <Pressable
                key={dur.label}
                onPress={() => setEndTime(targetEnd)}
                style={[styles.chip, endTime === targetEnd && styles.chipActive]}
              >
                <Text style={[styles.chipText, endTime === targetEnd && styles.chipTextActive]}>
                  {dur.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </List>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <WhiteSpace size="lg" />
      <Button type="primary" loading={submitting} onPress={handleSubmit}>
        {submitLabel}
      </Button>
    </>
  )
}

const styles = StyleSheet.create({
  error: { color: '#F87171', marginTop: 12, marginHorizontal: 16, fontSize: 13 },
  hint: { color: '#64748B', fontSize: 11, marginTop: 6, marginHorizontal: 16 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#111827'
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B'
  },
  chipActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1D4ED8'
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600'
  }
})
