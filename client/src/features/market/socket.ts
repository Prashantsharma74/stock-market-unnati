import { io, type Socket } from 'socket.io-client'

export type MarketClientSocket = Socket

function marketSocketUrl() {
  const base = import.meta.env.VITE_API_BASE_URL?.trim()
  if (base) return base
  return window.location.origin
}

export function createMarketSocket(): MarketClientSocket {
  return io(marketSocketUrl(), {
    path: '/socket.io',
    withCredentials: true,
    autoConnect: true,
  })
}

export function emitStockSubscription(
  socket: MarketClientSocket,
  event: 'subscribe:stock' | 'unsubscribe:stock',
  symbol: string,
  exchange: string,
) {
  socket.emit(event, { symbol, exchange })
}
