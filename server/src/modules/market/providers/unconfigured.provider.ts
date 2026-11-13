import type { MarketDataProvider } from '../market.provider'
import type { MarketStatus } from '../market.types'

export function createUnconfiguredProvider(options: { mode: MarketStatus['mode']; message: string }): MarketDataProvider {
  return {
    id: 'none',
    mode: options.mode,
    async start() {},
    async stop() {},
    getStatus() {
      return {
        provider: 'none',
        mode: options.mode,
        connection: 'unconfigured',
        configured: false,
        message: options.message,
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
    onTick() {
      return () => undefined
    },
  }
}
