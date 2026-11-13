import { ApiError, api } from '../../lib/api.ts'
import type { MarketExchange } from './types.ts'
import { feedDownMessage } from './types.ts'

export function normalizeSymbolQuery(value: string) {
  return value.replace(/[^A-Za-z0-9-]/g, '').slice(0, 20)
}

export function getMarketHealth(signal?: AbortSignal) {
  return api<unknown>('/api/market/health', { signal })
}

export function listMarketStocks(filter: { q?: string; exchange?: MarketExchange }, signal?: AbortSignal) {
  const params = new URLSearchParams()
  const q = filter.q ? normalizeSymbolQuery(filter.q) : ''
  if (q) params.set('q', q)
  if (filter.exchange) params.set('exchange', filter.exchange)
  const search = params.toString()
  return api<unknown>(`/api/market/stocks${search ? `?${search}` : ''}`, { signal })
}

export function listMarketIndices(signal?: AbortSignal) {
  return api<unknown>('/api/market/indices', { signal })
}

export function getMarketExplore(signal?: AbortSignal) {
  return api<unknown>('/api/market/stocks/explore', { signal })
}

export function getMarketStockQuote(symbol: string, exchange: MarketExchange, signal?: AbortSignal) {
  const params = new URLSearchParams({ exchange })
  return api<unknown>(`/api/market/stocks/${encodeURIComponent(symbol)}?${params}`, { signal })
}

export function listIndiaSymbols(
  filter: { q?: string; offset?: number; limit?: number; indices?: boolean },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams()
  const q = filter.q?.trim() ?? ''
  if (q) params.set('q', q)
  if (filter.offset !== undefined) params.set('offset', String(filter.offset))
  if (filter.limit !== undefined) params.set('limit', String(filter.limit))
  if (filter.indices) params.set('indices', '1')
  const search = params.toString()
  return api<unknown>(`/api/market/symbols/india${search ? `?${search}` : ''}`, { signal })
}

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

export function messageFrom(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'MARKET_FEED_UNAVAILABLE') return feedDownMessage
    return error.message
  }
  return 'The market service could not be reached.'
}
