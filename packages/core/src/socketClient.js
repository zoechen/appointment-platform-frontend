import { io } from 'socket.io-client'

/**
 * 即時串流連線的單例封裝。connect() 要在登入成功、拿到 token 之後呼叫；
 * disconnect() 在登出時呼叫。events 用 on()/off() 訂閱，行為跟原生 socket.io-client 一樣，
 * 這層封裝主要是統一「用哪個 baseUrl／token 連線」，避免每個畫面各自重複這段邏輯。
 */

let socket = null

export function connectRealtime({ baseUrl, token }) {
  if (socket) {
    socket.disconnect()
  }
  socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket']
  })
  return socket
}

export function disconnectRealtime() {
  socket?.disconnect()
  socket = null
}

export function getSocket() {
  return socket
}

export function onRealtimeEvent(event, handler) {
  socket?.on(event, handler)
  return () => socket?.off(event, handler)
}
