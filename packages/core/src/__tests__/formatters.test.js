import { describe, it, expect } from 'vitest'
import {
  formatAppointmentStatus,
  formatPlatformName,
  formatDateTime,
  formatTimeRange,
  zonedDateTimeToIso,
  toZonedDateAndTime
} from '../formatters.js'

describe('formatAppointmentStatus', () => {
  it('對應中文標籤', () => {
    expect(formatAppointmentStatus('confirmed')).toBe('已確認')
    expect(formatAppointmentStatus('cancelled')).toBe('已取消')
  })
  it('未知狀態時直接回傳原字串', () => {
    expect(formatAppointmentStatus('weird')).toBe('weird')
  })
})

describe('formatPlatformName', () => {
  it('對應平台顯示名稱', () => {
    expect(formatPlatformName('facebook')).toBe('Facebook')
    expect(formatPlatformName('line')).toBe('LINE')
  })
})

describe('formatDateTime', () => {
  it('把 UTC 時間轉成 Asia/Taipei 顯示', () => {
    expect(formatDateTime('2026-08-05T06:00:00.000Z')).toBe('2026/08/05 14:00')
  })
  it('空字串回傳空字串', () => {
    expect(formatDateTime('')).toBe('')
  })
  it('無效字串回傳空字串', () => {
    expect(formatDateTime('not-a-date')).toBe('')
  })
})

describe('formatTimeRange', () => {
  it('組合日期與時間區間', () => {
    expect(formatTimeRange('2026-08-05T06:00:00.000Z', '2026-08-05T07:00:00.000Z')).toBe(
      '2026/08/05 14:00–15:00'
    )
  })
})

describe('zonedDateTimeToIso & toZonedDateAndTime', () => {
  it('依據店家時區將當地日期時間轉成 UTC ISO，並能還原回當地日期時間', () => {
    const iso = zonedDateTimeToIso('2026-08-05', '14:30', 'Asia/Taipei')
    expect(iso).toBe('2026-08-05T06:30:00.000Z')
    expect(toZonedDateAndTime(iso, 'Asia/Taipei')).toEqual({
      date: '2026-08-05',
      time: '14:30'
    })
  })

  it('拒絕不存在的日期或無效的時間格式', () => {
    expect(zonedDateTimeToIso('2026-02-30', '14:00', 'Asia/Taipei')).toBeNull()
    expect(zonedDateTimeToIso('2026-08-05', '25:00', 'Asia/Taipei')).toBeNull()
  })
})
