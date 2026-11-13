import type { MarketDataProvider } from '../market.provider'
import type { MarketStatus, NormalizedTick } from '../market.types'

// Official TrueData pages do not publish the sandbox WebSocket URL, the auth success
// and subscribe payload, or the tick frame. Support only says to select RT (8086) or
// RT (8082) on https://wstest.truedata.in/. That page shows
// wss://push.truedata.in:8082?user=&password= without a success message. Field order
// is documented; the socket envelope is not. This adapter does not connect and does
// not emit prices. TRUEDATA_REALTIME_URL is ignored until those fields are verified.

export const trueDataUnverifiedMessage =
  'TrueData is configured, but the realtime handshake is unverified. No quotes are emitted.'

export type TrueDataSocket = {
  close(): void
}

export type TrueDataSocketFactory = (url: string) => TrueDataSocket

const officialHandshakeVerified = false

function refuseUnverifiedSocket(socketFactory: TrueDataSocketFactory | undefined) {
  // The factory is the only socket entry. It stays uncalled until the handshake is verified.
  if (socketFactory === undefined || !officialHandshakeVerified) return
  throw new Error('TrueData socket URL is not verified.')
}

export function createTrueDataProvider(options: {
  mode: MarketStatus['mode']
  username: string
  password: string
  socketFactory?: TrueDataSocketFactory
}): MarketDataProvider {
  if (options.username.trim() === '' || options.password.trim() === '') {
    throw new Error('Refusing to construct the TrueData provider without both secrets.')
  }

  const mode = options.mode
  const socketFactory = options.socketFactory
  refuseUnverifiedSocket(socketFactory)
  const listeners = new Set<(tick: NormalizedTick) => void>()

  return {
    id: 'truedata',
    mode,
    async start() {
      refuseUnverifiedSocket(socketFactory)
    },
    async stop() {},
    getStatus() {
      return {
        provider: 'truedata',
        mode,
        connection: 'disconnected',
        configured: true,
        message: trueDataUnverifiedMessage,
        checkedAt: new Date().toISOString(),
      }
    },
    async subscribe() {},
    async unsubscribe() {},
    async getQuote() {
      return null
    },
    async listQuotes() {
      return []
    },
    async getIndices() {
      return []
    },
    async getHistory() {
      return []
    },
    onTick(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
