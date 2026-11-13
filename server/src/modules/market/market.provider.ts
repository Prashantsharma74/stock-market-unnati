import type { CandleInterval, MarketExchange, MarketStatus, NormalizedCandle, NormalizedTick } from './market.types'

export interface MarketDataProvider {
  readonly id: MarketStatus['provider']
  readonly mode: MarketStatus['mode']
  start(): Promise<void>
  stop(): Promise<void>
  getStatus(): MarketStatus
  subscribe(symbol: string, exchange: MarketExchange): Promise<void>
  unsubscribe(symbol: string, exchange: MarketExchange): Promise<void>
  getQuote(symbol: string, exchange: MarketExchange): Promise<NormalizedTick | null>
  listQuotes(query: { q?: string; exchange?: MarketExchange }): Promise<NormalizedTick[]>
  getIndices(): Promise<NormalizedTick[]>
  getHistory(symbol: string, exchange: MarketExchange, interval: CandleInterval): Promise<NormalizedCandle[]>
  onTick(listener: (tick: NormalizedTick) => void): () => void
}
