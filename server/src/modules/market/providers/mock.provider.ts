import type { MarketDataProvider } from '../market.provider'
import type { CandleInterval, MarketExchange, MarketStatus, NormalizedCandle, NormalizedTick } from '../market.types'
import { canonicalSampleSymbol, sampleDataLabel, sampleIndexes, sampleStocks, sampleSymbolKind, type SampleSymbol } from '../sampleSymbols'

type Seed = {
  ltp: number
  previousClose: number
  change: number
  changePct: number
}

type NodeEnvName = 'development' | 'test' | 'production'

const sampleHistoryEnd = Date.parse('2026-11-12T00:00:00.000Z')
const dayMs = 24 * 60 * 60 * 1000
const tickMs = 1000

const candlePlan: Record<CandleInterval, { count: number; stepDays: number }> = {
  '1D': { count: 1, stepDays: 1 },
  '1W': { count: 5, stepDays: 1 },
  '1M': { count: 4, stepDays: 7 },
  '3M': { count: 12, stepDays: 7 },
  '6M': { count: 6, stepDays: 30 },
  '1Y': { count: 12, stepDays: 30 },
  '5Y': { count: 5, stepDays: 365 },
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function seedFromPercent(ltp: number, changePct: number): Seed {
  const previousClose = round2(ltp / (1 + changePct / 100))
  return {
    ltp,
    previousClose,
    change: round2(ltp - previousClose),
    changePct,
  }
}

function seedFromChange(ltp: number, change: number, changePct: number): Seed {
  return {
    ltp,
    previousClose: round2(ltp - change),
    change,
    changePct,
  }
}

// Fictional levels already published by the sample catalog. This table cannot grow past the allowlist.
const seeds: Record<SampleSymbol, Seed> = {
  SMPLBANK: seedFromPercent(842.5, 1.8),
  ORBITS: seedFromPercent(1264, -0.6),
  RGRID: seedFromPercent(318.4, 2.4),
  LOTUS: seedFromPercent(590, 0.4),
  SAMPLE50: seedFromChange(22480, 78.6, 0.35),
  SAMPLEBANK: seedFromChange(49810, 287.4, 0.58),
  SAMPLEMID: seedFromChange(51220, -112.8, -0.22),
  SAMPLEIT: seedFromChange(38140, 95.2, 0.25),
  SAMPLEAUTO: seedFromChange(18920, -39.7, -0.21),
}

function buildTick(symbol: SampleSymbol): NormalizedTick {
  const seed = seeds[symbol]
  return {
    symbol,
    exchange: 'SAMPLE',
    kind: sampleSymbolKind(symbol),
    ltp: seed.ltp,
    previousClose: seed.previousClose,
    change: seed.change,
    changePct: seed.changePct,
    ts: new Date().toISOString(),
    source: 'mock',
    label: sampleDataLabel,
  }
}

function buildHistory(symbol: SampleSymbol, interval: CandleInterval): NormalizedCandle[] {
  const seed = seeds[symbol]
  const plan = candlePlan[interval]
  const candles: NormalizedCandle[] = []

  for (let index = 0; index < plan.count; index += 1) {
    const progress = plan.count === 1 ? 1 : index / (plan.count - 1)
    const close = round2(seed.previousClose + (seed.ltp - seed.previousClose) * progress)
    const open = index === 0 ? seed.previousClose : candles[index - 1].close
    const daysBack = (plan.count - 1 - index) * plan.stepDays
    candles.push({
      symbol,
      exchange: 'SAMPLE',
      interval,
      time: new Date(sampleHistoryEnd - daysBack * dayMs).toISOString(),
      open,
      high: round2(Math.max(open, close)),
      low: round2(Math.min(open, close)),
      close,
      volume: 0,
      source: 'mock',
      label: sampleDataLabel,
    })
  }

  return candles
}

function allowed(symbol: string, exchange: MarketExchange): SampleSymbol | undefined {
  if (exchange !== 'SAMPLE') return undefined
  return canonicalSampleSymbol(symbol)
}

export function createMockProvider(options: { mode: MarketStatus['mode']; nodeEnv: NodeEnvName }): MarketDataProvider {
  if (options.nodeEnv !== 'development' && options.nodeEnv !== 'test') {
    throw new Error('Refusing to construct the mock market provider in production.')
  }

  const subscribed = new Set<SampleSymbol>()
  const listeners = new Set<(tick: NormalizedTick) => void>()
  let timer: ReturnType<typeof setInterval> | undefined

  function publish() {
    for (const symbol of subscribed) {
      const tick = buildTick(symbol)
      for (const listener of [...listeners]) listener(tick)
    }
  }

  return {
    id: 'mock',
    mode: options.mode,
    async start() {
      if (timer) return
      publish()
      timer = setInterval(publish, tickMs)
      timer.unref()
    },
    async stop() {
      if (!timer) return
      clearInterval(timer)
      timer = undefined
    },
    getStatus() {
      return {
        provider: 'mock',
        mode: options.mode,
        connection: 'mock',
        configured: true,
        message: sampleDataLabel,
        checkedAt: new Date().toISOString(),
      }
    },
    async subscribe(symbol, exchange) {
      const canonical = allowed(symbol, exchange)
      if (!canonical) return
      subscribed.add(canonical)
    },
    async unsubscribe(symbol, exchange) {
      const canonical = allowed(symbol, exchange)
      if (!canonical) return
      subscribed.delete(canonical)
    },
    async getQuote(symbol, exchange) {
      const canonical = allowed(symbol, exchange)
      if (!canonical) return null
      return buildTick(canonical)
    },
    async listQuotes(query) {
      if (query.exchange && query.exchange !== 'SAMPLE') return []
      const q = query.q?.trim().toUpperCase() ?? ''
      return sampleStocks.filter((symbol) => symbol.includes(q)).map((symbol) => buildTick(symbol))
    },
    async getIndices() {
      return sampleIndexes.map((symbol) => buildTick(symbol))
    },
    async getHistory(symbol, exchange, interval) {
      const canonical = allowed(symbol, exchange)
      if (!canonical) return []
      return buildHistory(canonical, interval)
    },
    onTick(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
