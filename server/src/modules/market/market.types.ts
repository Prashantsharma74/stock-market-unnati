export const marketExchanges = ['NSE', 'BSE', 'SAMPLE', 'US', 'HK', 'SH', 'SZ', 'JP', 'KS', 'IN', 'TW'] as const

export type MarketExchange = (typeof marketExchanges)[number]

export const infowayExchanges = ['US', 'HK', 'SH', 'SZ', 'JP', 'KS', 'IN', 'TW'] as const

export type InfowayExchange = (typeof infowayExchanges)[number]

export function isMarketExchange(value: string): value is MarketExchange {
  return (marketExchanges as readonly string[]).includes(value)
}

export function isInfowayExchange(value: string): value is InfowayExchange {
  return (infowayExchanges as readonly string[]).includes(value)
}

export type MarketDataSource = 'unconfigured' | 'mock' | 'provider'

export type CandleInterval = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'

export type NormalizedTick = {
  symbol: string
  exchange: MarketExchange
  kind: 'stock' | 'index'
  ltp: number
  previousClose: number
  change: number
  changePct: number
  volume?: number
  bid?: number
  ask?: number
  ts: string
  source: MarketDataSource
  label?: string
}

export type NormalizedCandle = {
  symbol: string
  exchange: MarketExchange
  interval: CandleInterval
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  source: MarketDataSource
  label?: string
}

export type MarketStatus = {
  provider: 'none' | 'mock' | 'truedata' | 'infoway'
  mode: 'sandbox' | 'production'
  connection: 'unconfigured' | 'mock' | 'connecting' | 'connected' | 'disconnected'
  configured: boolean
  message: string
  checkedAt: string
}
