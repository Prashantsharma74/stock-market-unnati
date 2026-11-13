export type MarketExchange = 'NSE' | 'BSE' | 'SAMPLE' | 'US' | 'HK' | 'SH' | 'SZ' | 'JP' | 'KS' | 'IN' | 'TW'

export type MarketDataSource = 'unconfigured' | 'mock' | 'provider'

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

export type MarketStatus = {
  provider: 'none' | 'mock' | 'truedata' | 'infoway'
  mode: 'sandbox' | 'production'
  connection: 'unconfigured' | 'mock' | 'connecting' | 'connected' | 'disconnected'
  configured: boolean
  message: string
  checkedAt: string
}

export type ExchangeFilter = 'ALL' | MarketExchange

export type StockListPayload = {
  dataSource: MarketDataSource
  items: unknown[]
}

export type MarketSubscription = {
  symbol: string
  exchange: MarketExchange
}

export const sampleDataLabel = 'Sample data. Not an NSE or BSE quote.'

export const feedDownMessage = 'Market feed is not connected. No live prices.'

export const feedConnectingMessage = 'Market feed is connecting. No live prices.'
