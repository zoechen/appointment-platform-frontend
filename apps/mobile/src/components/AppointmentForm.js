import { useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { List, InputItem, Button, WhiteSpace } from '@ant-design/react-native'

/**
 * 目前日期/時間用純文字輸入（YYYY-MM-DD / HH:mm），先求跨平台（含 Web）都能動；
 * 之後可以換成 antd-mobile-rn 的 DatePicker，但它是用 Modal + Picker 滾輪的互動方式，
 * 在 Web 上的操作體感跟原生 App 差蠻多，先留到有明確 UX 需求時再處理。
 *
 * 注意：目前是把日期時間當作「裝置當地時間」直接組字串送給後端，
 * 沒有另外處理「店家設定的時區」跟「裝置時區」不同的情況——這跟
 * 設計文件裡列的待確認事項一致，先用最簡單的方式讓功能跑起來。
 */
export function AppointmentForm({ initialValues, onSubmit, submitLabel = '儲存', submitting }) {
  const [title, setTitle] = useState(initialValues?.title || '')
  const [customerName, setCustomerName] = useState(initialValues?.customerName || '')
  const [customerContact, setCustomerContact] = useState(initialValues?.customerContact || '')
  const [date, setDate] = useState(initialValues?.date || '')
  const [startTime, setStartTime] = useState(initialValues?.startTime || '')
  const [endTime, setEndTime] = useState(initialValues?.endTime || '')
  const [error, setError] = useState('')

  function handleSubmit() {
    if (!title || !date || !startTime || !endTime) {
      setError('請填寫標題、日期與起訖時間')
      return
    }
    setError('')
    onSubmit({
      title,
      customerName: customerName || undefined,
      customerContact: customerContact || undefined,
      startTime: `${date}T${startTime}:00`,
      endTime: `${date}T${endTime}:00`
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

      <List renderHeader="時間">
        <InputItem clear value={date} onChange={setDate} placeholder="2026-08-05">
          日期
        </InputItem>
        <InputItem clear value={startTime} onChange={setStartTime} placeholder="14:00">
          開始時間
        </InputItem>
        <InputItem clear value={endTime} onChange={setEndTime} placeholder="15:00">
          結束時間
        </InputItem>
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
  hint: { color: '#64748B', fontSize: 11, marginTop: 6, marginHorizontal: 16 }
})
