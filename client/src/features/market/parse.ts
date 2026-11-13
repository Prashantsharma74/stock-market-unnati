import type { MarketDataSource, MarketExchange, MarketStatus, MarketSubscription, NormalizedTick, StockListPayload } from './types.ts'
import { sampleDataLabel } from './types.ts'

const symbolPattern = /^[A-Z0-9-]{1,20}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isExchange(value: unknown): value is MarketExchange {
  return (
    value === 'NSE' ||
    value === 'BSE' ||
    value === 'SAMPLE' ||
    value === 'US' ||
    value === 'HK' ||
    value === 'SH' ||
    value === 'SZ' ||
    value === 'JP' ||
    value === 'KS' ||
    value === 'IN' ||
    value === 'TW'
  )
}

function isSource(value: unknown): value is MarketDataSource {
  return value === 'unconfigured' || value === 'mock' || value === 'provider'
}

export function subscriptionKey(symbol: string, exchange: MarketExchange) {
  return `${exchange}:${symbol}`
}

export function feedServesQuotes(status: MarketStatus | null | undefined) {
  return status?.connection === 'mock' || status?.connection === 'connected'
}

export function isMarketStatus(value: unknown): value is MarketStatus {
  if (!isRecord(value)) return false
  return (
    (value.provider === 'none' || value.provider === 'mock' || value.provider === 'truedata' || value.provider === 'infoway') &&
    (value.mode === 'sandbox' || value.mode === 'production') &&
    (value.connection === 'unconfigured' ||
      value.connection === 'mock' ||
      value.connection === 'connecting' ||
      value.connection === 'connected' ||
      value.connection === 'disconnected') &&
    typeof value.configured === 'boolean' &&
    typeof value.message === 'string' &&
    typeof value.checkedAt === 'string'
  )
}

export function isNormalizedTick(value: unknown): value is NormalizedTick {
  if (!isRecord(value)) return false
  if (typeof value.symbol !== 'string' || !symbolPattern.test(value.symbol)) return false
  if (!isExchange(value.exchange)) return false
  if (value.kind !== 'stock' && value.kind !== 'index') return false
  if (!isFiniteNumber(value.ltp) || !isFiniteNumber(value.previousClose)) return false
  if (!isFiniteNumber(value.change) || !isFiniteNumber(value.changePct)) return false
  if (!isOptionalNumber(value.volume) || !isOptionalNumber(value.bid) || !isOptionalNumber(value.ask)) return false
  if (typeof value.ts !== 'string' || value.ts.length === 0) return false
  if (!isSource(value.source)) return false
  if (value.label !== undefined && typeof value.label !== 'string') return false
  return true
}

function isOptionalNumber(value: unknown) {
  return value === undefined || isFiniteNumber(value)
}

function copyTick(tick: NormalizedTick, label?: string): NormalizedTick {
  const next: NormalizedTick = {
    symbol: tick.symbol,
    exchange: tick.exchange,
    kind: tick.kind,
    ltp: tick.ltp,
    previousClose: tick.previousClose,
    change: tick.change,
    changePct: tick.changePct,
    ts: tick.ts,
    source: tick.source,
  }
  if (tick.volume !== undefined) next.volume = tick.volume
  if (tick.bid !== undefined) next.bid = tick.bid
  if (tick.ask !== undefined) next.ask = tick.ask
  if (label !== undefined) next.label = label
  return next
}

export function presentTick(value: unknown, status: MarketStatus | null): NormalizedTick | null {
  if (!isNormalizedTick(value)) return null
  if (status && !feedServesQuotes(status)) return null

  if (value.source === 'mock') {
    if (status && status.connection !== 'mock') return null
    if (value.exchange !== 'SAMPLE') return null
    return copyTick(value, sampleDataLabel)
  }

  if (value.source === 'provider') {
    if (status && status.connection !== 'connected') return null
    if (value.exchange === 'SAMPLE') return null
    if (value.label === sampleDataLabel) return null
    const label = value.label?.trim()
    return copyTick(value, label ? label : undefined)
  }

  return null
}

export function presentListedTick(value: unknown, dataSource: MarketDataSource, status: MarketStatus | null) {
  if (dataSource === 'unconfigured') return null
  if (status && !feedServesQuotes(status)) return null
  if (!isNormalizedTick(value)) return null

  if (dataSource === 'mock') {
    if (status && status.connection !== 'mock') return null
    if (value.source !== 'mock' || value.exchange !== 'SAMPLE') return null
    return copyTick(value, sampleDataLabel)
  }

  if (status && status.connection !== 'connected') return null
  if (value.source !== 'provider' || value.exchange === 'SAMPLE') return null
  if (value.label === sampleDataLabel) return null
  const label = value.label?.trim()
  return copyTick(value, label ? label : undefined)
}

export function parseStockList(value: unknown): StockListPayload | null {
  if (!isRecord(value)) return null
  if (!isSource(value.dataSource) || !Array.isArray(value.items)) return null
  return { dataSource: value.dataSource, items: value.items }
}

export function parseIndexList(value: unknown): unknown[] | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null
  return value.items
}

export function sourceText(tick: NormalizedTick) {
  if (tick.source === 'mock') return sampleDataLabel
  if (tick.label && tick.label.trim() && tick.label !== sampleDataLabel) return tick.label
  if (tick.source === 'provider') return 'Provider'
  return 'Unconfigured'
}

export function uniqueSubscriptions(ticks: NormalizedTick[]): MarketSubscription[] {
  const seen = new Set<string>()
  const list: MarketSubscription[] = []
  for (const tick of ticks) {
    const key = subscriptionKey(tick.symbol, tick.exchange)
    if (seen.has(key)) continue
    seen.add(key)
    list.push({ symbol: tick.symbol, exchange: tick.exchange })
  }
  return list
}
