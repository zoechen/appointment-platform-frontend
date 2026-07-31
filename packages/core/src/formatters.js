/**
 * 純函式的格式化工具，iOS / Android / Web 都會用到，所以放在 core 這裡共用，
 * 不依賴任何平台 API（不用 Intl 以外的東西），方便寫單元測試。
 */

const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * 跟後端 webhooks/messagingWindow.js 的邏輯一致：Meta（FB/IG）規定商家只能在
 * 客人最後一次傳訊的 24 小時內用一般訊息回覆，這裡在前端提前算出來，
 * 好在畫面上警示員工，而不是等按下送出才被後端擋下來。
 * LINE 沒有這個時間限制，一律回傳 true。
 */
export function isWithinMessagingWindow(conversation, platform) {
  if (platform === 'line') return true
  if (!conversation?.LastCustomerMessageAt) return false
  return Date.now() - new Date(conversation.LastCustomerMessageAt).getTime() < MESSAGING_WINDOW_MS
}
const STATUS_LABELS = {
  pending: '待確認',
  confirmed: '已確認',
  cancelled: '已取消',
  completed: '已完成'
}

export function formatAppointmentStatus(status) {
  return STATUS_LABELS[status] || status
}

const PLATFORM_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  line: 'LINE'
}

export function formatPlatformName(platform) {
  return PLATFORM_LABELS[platform] || platform
}

/**
 * 把後端回傳的 ISO 時間字串格式化成畫面上要顯示的「日期 時間」，
 * 例如 2026-08-05T14:00:00Z -> '2026/08/05 14:00'（依傳入的 timeZone 顯示）
 */
export function formatDateTime(isoString, timeZone = 'Asia/Taipei') {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''

  const formatter = new Intl.DateTimeFormat('zh-TW', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  return formatter.format(date).replace(/\//g, '/').replace(',', '')
}

export function formatTimeRange(startIso, endIso, timeZone = 'Asia/Taipei') {
  if (!startIso || !endIso) return ''
  const timeFormatter = new Intl.DateTimeFormat('zh-TW', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const start = new Date(startIso)
  const end = new Date(endIso)
  return `${dateFormatter.format(start)} ${timeFormatter.format(start)}–${timeFormatter.format(end)}`
}
