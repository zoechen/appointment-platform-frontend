import { describe, it, expect } from 'vitest'
import {
  formatAppointmentStatus,
  formatPlatformName,
  formatDateTime,
  formatTimeRange
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
