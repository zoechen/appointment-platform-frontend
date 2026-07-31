import { useEffect } from 'react'
import { onRealtimeEvent, useAppointmentsStore, useConversationsStore } from '@app/core'

/**
 * 在分頁 layout 掛載一次即可：把 Socket.IO 收到的事件轉發給對應的 store，
 * 讓「預約」「對話」分頁在背景就能保持最新，不需要每個畫面各自訂閱一次。
 */
export function useRealtimeSync() {
  const applyAppointmentEvent = useAppointmentsStore((state) => state.applyRealtimeEvent)
  const applyMessageEvent = useConversationsStore((state) => state.applyRealtimeEvent)

  useEffect(() => {
    const offNew = onRealtimeEvent('appointment:new', (appointment) =>
      applyAppointmentEvent('appointment:new', appointment)
    )
    const offUpdated = onRealtimeEvent('appointment:updated', (appointment) =>
      applyAppointmentEvent('appointment:updated', appointment)
    )
    const offMessage = onRealtimeEvent('message:new', (message) =>
      applyMessageEvent('message:new', message)
    )
    const offConversationUpdated = onRealtimeEvent('conversation:updated', (conversation) =>
      applyMessageEvent('conversation:updated', conversation)
    )

    return () => {
      offNew?.()
      offUpdated?.()
      offMessage?.()
      offConversationUpdated?.()
    }
  }, [applyAppointmentEvent, applyMessageEvent])
}
