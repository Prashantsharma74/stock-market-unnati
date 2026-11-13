import assert from 'node:assert/strict'
import http from 'node:http'
import { describe, it } from 'node:test'
import cookieParser from 'cookie-parser'
import express, { type Express } from 'express'
import { createApp } from '../../app'
import { errorHandler } from '../../middleware/errorHandler'
import { signAccessToken } from '../../utils/tokens'
import { createMarketDataProvider } from './createProvider'
import type { MarketDataProvider } from './market.provider'
import { createMarketRouter } from './market.routes'
import { createMarketRuntime } from './market.service'
import { authenticateSocketCookie } from './market.socket'
import type { MarketExchange, MarketStatus, NormalizedTick } from './market.types'
import { historySchema, listStocksSchema, stockQuoteSchema, subscriptionPayloadSchema } from './market.validators'
import { createMockProvider } from './providers/mock.provider'
import {
  createMemoryQuoteCache,
  isPublishableTick,
  marketIndexKey,
  marketQuoteKey,
  marketStatusKey,
  marketSubscriberKey,
  memoryQuoteCacheLabel,
} from './redisQuotes'
import { sampleDataLabel } from './sampleSymbols'
import { createSubscriptionRegistry } from './subscriptionRegistry'

const sentinelPrice = 123456.78

function unconfiguredStatus(): MarketStatus {
  return {
    provider: 'none',
    mode: 'sandbox',
    connection: 'unconfigured',
    configured: false,
    message: 'Market data adapter is not installed.',
    checkedAt: '2026-11-13T00:00:00.000Z',
  }
}

function niftyTick(source: NormalizedTick['source'] = 'provider'): NormalizedTick {
  return {
    symbol: 'NIFTY',
    exchange: 'NSE',
    kind: 'index',
    ltp: sentinelPrice,
    previousClose: sentinelPrice - 1,
    change: 1,
    changePct: 0.01,
    ts: '2026-11-13T00:00:00.000Z',
    source,
    ...(source === 'mock' ? { label: sampleDataLabel } : {}),
  }
}

function sensexTick(): NormalizedTick {
  return {
    symbol: 'SENSEX',
    exchange: 'BSE',
    kind: 'index',
    ltp: sentinelPrice,
    previousClose: sentinelPrice - 1,
    change: 1,
    changePct: 0.01,
    ts: '2026-11-13T00:00:00.000Z',
    source: 'provider',
  }
}

function countingProvider(status: MarketStatus, tick: NormalizedTick | null) {
  const calls = { quote: 0, list: 0, indices: 0, history: 0, subscribe: 0 }
  const provider: MarketDataProvider = {
    id: status.provider,
    mode: status.mode,
    async start() {},
    async stop() {},
    getStatus: () => status,
    async subscribe() {
      calls.subscribe += 1
    },
    async unsubscribe() {},
    async getQuote() {
      calls.quote += 1
      return tick
    },
    async listQuotes() {
      calls.list += 1
      return tick ? [tick] : []
    },
    async getIndices() {
      calls.indices += 1
      return tick?.kind === 'index' ? [tick] : []
    },
    async getHistory() {
      calls.history += 1
      return []
    },
    onTick() {
      return () => undefined
    },
  }
  return { provider, calls }
}

function accessToken() {
  return signAccessToken({
    sub: '507f1f77bcf86cd799439011',
    role: 'user',
    email: 'phase3@example.com',
  })
}

async function withServer(app: Express, run: (baseUrl: string) => Promise<void>) {
  const server = http.createServer(app)
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected a TCP port')
  try {
    await run(`http://127.0.0.1:${address.port}`)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

function marketApp(provider: MarketDataProvider, cache = createMemoryQuoteCache(memoryQuoteCacheLabel)) {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/market', createMarketRouter(createMarketRuntime({ provider, cache })))
  app.use(errorHandler)
  return app
}

function assertNoFabricatedQuote(body: unknown) {
  const text = JSON.stringify(body)
  assert.equal(text.includes('"ltp"'), false)
  assert.equal(text.includes('NIFTY'), false)
  assert.equal(text.includes('SENSEX'), false)
  assert.equal(text.includes(String(sentinelPrice)), false)
  assert.equal(text.includes('"source":"provider"'), false)
}

describe('market subscription registry', () => {
  it('reference-counts one provider subscription per exchange and symbol', async () => {
    const calls: Array<{ action: 'subscribe' | 'unsubscribe'; symbol: string; exchange: MarketExchange }> = []
    const registry = createSubscriptionRegistry({
      async subscribe(symbol, exchange) {
        calls.push({ action: 'subscribe', symbol, exchange })
      },
      async unsubscribe(symbol, exchange) {
        calls.push({ action: 'unsubscribe', symbol, exchange })
      },
    })

    assert.equal(await registry.subscribe('SMPLBANK', 'SAMPLE'), 1)
    assert.equal(await registry.subscribe('smplbank', 'SAMPLE'), 2)
    assert.equal(await registry.subscribe('SMPLBANK', 'SAMPLE'), 3)
    assert.equal(calls.filter((call) => call.action === 'subscribe').length, 1)

    assert.equal(await registry.unsubscribe('SMPLBANK', 'SAMPLE'), 2)
    assert.equal(calls.filter((call) => call.action === 'unsubscribe').length, 0)
    assert.equal(await registry.unsubscribe('SMPLBANK', 'SAMPLE'), 1)
    assert.equal(await registry.unsubscribe('SMPLBANK', 'SAMPLE'), 0)
    assert.deepEqual(
      calls.filter((call) => call.action === 'unsubscribe'),
      [{ action: 'unsubscribe', symbol: 'SMPLBANK', exchange: 'SAMPLE' }],
    )
    assert.equal(await registry.unsubscribe('SMPLBANK', 'SAMPLE'), 0)
    assert.equal(calls.filter((call) => call.action === 'unsubscribe').length, 1)
    assert.equal(registry.count('SMPLBANK', 'SAMPLE'), 0)

    await registry.subscribe('RELIANCE', 'NSE')
    await registry.subscribe('RELIANCE', 'BSE')
    await registry.subscribe('RELIANCE', 'NSE')
    assert.deepEqual(
      calls.filter((call) => call.action === 'subscribe').slice(1),
      [
        { action: 'subscribe', symbol: 'RELIANCE', exchange: 'NSE' },
        { action: 'subscribe', symbol: 'RELIANCE', exchange: 'BSE' },
      ],
    )
    assert.equal(registry.count('RELIANCE', 'NSE'), 2)
    assert.equal(registry.count('RELIANCE', 'BSE'), 1)
  })

  it('waits for an in-flight subscribe instead of calling the provider twice', async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let subscribeCalls = 0
    const registry = createSubscriptionRegistry({
      async subscribe() {
        subscribeCalls += 1
        await gate
      },
      async unsubscribe() {},
    })

    const first = registry.subscribe('LOTUS', 'SAMPLE')
    const second = registry.subscribe('LOTUS', 'SAMPLE')
    assert.equal(subscribeCalls, 1)
    release()
    const counts = await Promise.all([first, second])
    assert.equal(subscribeCalls, 1)
    assert.equal(Math.max(...counts), 2)
    assert.equal(registry.count('LOTUS', 'SAMPLE'), 2)
  })

  it('does not emit an NSE or BSE tick when duplicate sample subscriptions are deduped', async () => {
    let subscribeCalls = 0
    const provider = createMockProvider({ mode: 'sandbox', nodeEnv: 'test' })
    const registry = createSubscriptionRegistry({
      async subscribe(symbol, exchange) {
        subscribeCalls += 1
        await provider.subscribe(symbol, exchange)
      },
      async unsubscribe(symbol, exchange) {
        await provider.unsubscribe(symbol, exchange)
      },
    })
    const seen: NormalizedTick[] = []
    const unsubscribe = provider.onTick((tick) => {
      seen.push(tick)
    })

    try {
      await registry.subscribe('NIFTY', 'NSE')
      await registry.subscribe('NIFTY', 'NSE')
      await registry.subscribe('SENSEX', 'BSE')
      await registry.subscribe('SMPLBANK', 'SAMPLE')
      await registry.subscribe('SMPLBANK', 'SAMPLE')
      assert.equal(subscribeCalls, 3)
      assert.equal(registry.count('NIFTY', 'NSE'), 2)
      assert.equal(registry.count('SMPLBANK', 'SAMPLE'), 2)

      await provider.start()
      assert.equal(seen.length, 1)
      assert.equal(seen[0]?.symbol, 'SMPLBANK')
      assert.equal(seen[0]?.exchange, 'SAMPLE')
      assert.equal(seen[0]?.source, 'mock')
      assert.equal(seen[0]?.label, sampleDataLabel)
      assert.equal(
        seen.some((tick) => tick.symbol === 'NIFTY' || tick.symbol === 'SENSEX'),
        false,
      )
    } finally {
      await provider.stop()
      unsubscribe()
    }
  })
})

describe('market quote cache', () => {
  it('keeps an unconfigured quote empty and refuses a cached live price', async () => {
    const cache = createMemoryQuoteCache(memoryQuoteCacheLabel)
    assert.equal(cache.backend, 'memory')
    assert.equal(cache.label, memoryQuoteCacheLabel)

    const offline = unconfiguredStatus()
    await cache.putStatus(offline)
    assert.equal(await cache.putQuote(niftyTick()), false)
    assert.equal(await cache.putQuote(sensexTick()), false)
    assert.equal(await cache.getQuote('NIFTY', 'NSE'), null)
    assert.equal(await cache.getQuote('SENSEX', 'BSE'), null)
    assert.deepEqual(await cache.listQuotes(), [])
    assert.deepEqual(await cache.listIndices(), [])
    assert.equal(isPublishableTick(niftyTick(), offline), false)
    assert.equal(isPublishableTick(sensexTick(), offline), false)

    const provider = createMockProvider({ mode: 'sandbox', nodeEnv: 'test' })
    const sample = await provider.getQuote('SMPLBANK', 'SAMPLE')
    const sampleIndex = await provider.getQuote('SAMPLE50', 'SAMPLE')
    assert.ok(sample)
    assert.ok(sampleIndex)
    assert.equal(await cache.putQuote(sample), false)

    const mockStatus: MarketStatus = {
      provider: 'mock',
      mode: 'sandbox',
      connection: 'mock',
      configured: true,
      message: sampleDataLabel,
      checkedAt: '2026-11-13T00:00:00.000Z',
    }
    await cache.putStatus(mockStatus)
    assert.equal(await cache.putQuote(niftyTick('mock')), false)
    assert.equal(await cache.putQuote({ ...sample, label: undefined, source: 'mock' }), false)
    assert.equal(await cache.putQuote(sample), true)
    assert.equal(await cache.putQuote(sampleIndex), true)
    await cache.setSubscriberCount('SMPLBANK', 'SAMPLE', 2)

    const stored = await cache.getQuote('SMPLBANK', 'SAMPLE')
    assert.ok(stored)
    assert.equal(stored.source, 'mock')
    assert.equal(stored.exchange, 'SAMPLE')
    assert.equal(stored.label, sampleDataLabel)
    assert.equal(await cache.getQuote('NIFTY', 'NSE'), null)

    const keys = await cache.keys()
    assert.ok(keys.includes(marketQuoteKey('SAMPLE', 'SMPLBANK')))
    assert.ok(keys.includes(marketIndexKey('SAMPLE', 'SAMPLE50')))
    assert.ok(keys.includes(marketSubscriberKey('SAMPLE', 'SMPLBANK')))
    assert.ok(keys.includes(marketStatusKey))

    await cache.putStatus({
      ...mockStatus,
      provider: 'none',
      connection: 'disconnected',
      configured: false,
      message: 'Market feed disconnected.',
    })
    assert.equal(await cache.getQuote('SMPLBANK', 'SAMPLE'), null)
    assert.equal(await cache.getQuote('SAMPLE50', 'SAMPLE'), null)
    const remaining = await cache.keys()
    assert.equal(remaining.includes(marketQuoteKey('SAMPLE', 'SMPLBANK')), false)
    assert.equal(remaining.includes(marketIndexKey('SAMPLE', 'SAMPLE50')), false)
    assert.ok(remaining.includes(marketSubscriberKey('SAMPLE', 'SMPLBANK')))
    assert.equal(await cache.getSubscriberCount('SMPLBANK', 'SAMPLE'), 2)
    assert.equal(isPublishableTick(sample, await cache.getStatus()), false)
  })
})

describe('market service quotes', () => {
  it('returns no NIFTY or SENSEX price when the feed is unconfigured', async () => {
    const { provider, calls } = countingProvider(unconfiguredStatus(), niftyTick())
    const cache = createMemoryQuoteCache(memoryQuoteCacheLabel)
    const market = createMarketRuntime({ provider, cache })

    assert.equal(market.getHealth().configured, false)
    assert.equal(market.getHealth().connection, 'unconfigured')
    assert.equal(await market.getStock('NIFTY', 'NSE'), null)
    assert.equal(await market.getStock('SENSEX', 'BSE'), null)
    assert.deepEqual(await market.listStocks({ q: 'NIFTY' }), { dataSource: 'unconfigured', items: [] })
    assert.deepEqual(await market.listIndices(), { items: [] })
    assert.deepEqual(await market.getHistory('NIFTY', 'NSE', '1D'), { candles: [] })
    assert.deepEqual(await market.getHistory('SENSEX', 'BSE', '1Y'), { candles: [] })
    assert.equal(calls.quote, 0)
    assert.equal(calls.list, 0)
    assert.equal(calls.indices, 0)
    assert.equal(await cache.getQuote('NIFTY', 'NSE'), null)
    assert.equal(await cache.putQuote(sensexTick()), false)
  })

  it('serves only labeled sample quotes from the mock feed', async () => {
    const provider = createMockProvider({ mode: 'sandbox', nodeEnv: 'test' })
    const market = createMarketRuntime({
      provider,
      cache: createMemoryQuoteCache(memoryQuoteCacheLabel),
    })

    const quote = await market.getStock('SMPLBANK', 'SAMPLE')
    assert.ok(quote)
    assert.equal(quote.symbol, 'SMPLBANK')
    assert.equal(quote.exchange, 'SAMPLE')
    assert.equal(quote.source, 'mock')
    assert.equal(quote.label, sampleDataLabel)

    assert.equal(await market.getStock('NIFTY', 'NSE'), null)
    assert.equal(await market.getStock('SENSEX', 'BSE'), null)
    assert.equal(await market.getStock('SMPLBANK', 'NSE'), null)

    const stocks = await market.listStocks({})
    assert.equal(stocks.dataSource, 'mock')
    assert.equal(
      stocks.items.some((item) => item.symbol === 'NIFTY' || item.symbol === 'SENSEX' || item.exchange !== 'SAMPLE'),
      false,
    )
    for (const item of stocks.items) {
      assert.equal(item.source, 'mock')
      assert.equal(item.label, sampleDataLabel)
    }

    const indices = await market.listIndices()
    assert.equal(
      indices.items.some((item) => item.symbol === 'NIFTY' || item.symbol === 'SENSEX'),
      false,
    )
    assert.deepEqual(await market.getHistory('NIFTY', 'NSE', '5Y'), { candles: [] })
    const history = await market.getHistory('SAMPLE50', 'SAMPLE', '1W')
    assert.ok(history.candles.length > 0)
    for (const candle of history.candles) {
      assert.equal(candle.exchange, 'SAMPLE')
      assert.equal(candle.source, 'mock')
      assert.equal(candle.label, sampleDataLabel)
    }

    const missed = await market.listStocks({ q: 'NIFTY', exchange: 'NSE' })
    assert.equal(missed.dataSource, 'mock')
    assert.deepEqual(missed.items, [])
  })
})

describe('market routes', () => {
  it('validates symbol, exchange, and interval', () => {
    assert.equal(subscriptionPayloadSchema.safeParse({ symbol: 'SMPLBANK', exchange: 'SAMPLE' }).success, true)
    assert.equal(subscriptionPayloadSchema.safeParse({ symbol: 'nifty', exchange: 'NSE' }).success, false)
    assert.equal(subscriptionPayloadSchema.safeParse({ symbol: 'NIFTY', exchange: 'NASDAQ' }).success, false)
    assert.equal(subscriptionPayloadSchema.safeParse({ symbol: '', exchange: 'NSE' }).success, false)
    assert.equal(stockQuoteSchema.safeParse({ params: { symbol: 'NIFTY' }, query: { exchange: 'NSE' } }).success, true)
    assert.equal(stockQuoteSchema.safeParse({ params: { symbol: 'NIFTY' }, query: {} }).success, false)
    assert.equal(historySchema.safeParse({ params: { symbol: 'SENSEX' }, query: { exchange: 'BSE', interval: '1D' } }).success, true)
    assert.equal(historySchema.safeParse({ params: { symbol: 'SENSEX' }, query: { exchange: 'BSE', interval: '2D' } }).success, false)
    assert.equal(listStocksSchema.safeParse({ query: {} }).success, true)
    assert.equal(listStocksSchema.safeParse({ query: { exchange: 'SAMPLE' } }).success, true)
  })

  it('accepts only the finora_access cookie for the socket handshake', () => {
    const token = accessToken()
    const header = `theme=dark; finora_access=${encodeURIComponent(token)}`
    const claims = authenticateSocketCookie(header)
    assert.ok(claims)
    assert.equal(claims.email, 'phase3@example.com')
    assert.equal(authenticateSocketCookie(undefined), undefined)
    assert.equal(authenticateSocketCookie('finora_access=not-a-token'), undefined)
    assert.equal(authenticateSocketCookie(`access_token=${encodeURIComponent(token)}`), undefined)
  })

  it('returns 503 with no price when the feed is unconfigured', async () => {
    const { provider, calls } = countingProvider(unconfiguredStatus(), niftyTick())
    const app = marketApp(provider)
    const token = accessToken()

    await withServer(app, async (baseUrl) => {
      const denied = await fetch(`${baseUrl}/api/market/stocks/NIFTY?exchange=NSE`)
      assert.equal(denied.status, 401)

      const health = await fetch(`${baseUrl}/api/market/health`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert.equal(health.status, 200)
      const healthBody = (await health.json()) as { success: boolean; data: Record<string, unknown> }
      assert.equal(healthBody.success, true)
      assert.equal(healthBody.data.configured, false)
      assert.equal(healthBody.data.connection, 'unconfigured')
      assert.equal(healthBody.data.provider, 'none')
      assert.deepEqual(Object.keys(healthBody.data).sort(), ['checkedAt', 'configured', 'connection', 'message', 'mode', 'provider'])
      assertNoFabricatedQuote(healthBody)

      const quote = await fetch(`${baseUrl}/api/market/stocks/NIFTY?exchange=NSE`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert.equal(quote.status, 503)
      const quoteBody = (await quote.json()) as { success: boolean; code: string; data?: unknown }
      assert.equal(quoteBody.success, false)
      assert.equal(quoteBody.code, 'MARKET_FEED_UNAVAILABLE')
      assert.equal(Object.hasOwn(quoteBody, 'data'), false)
      assertNoFabricatedQuote(quoteBody)

      const sensex = await fetch(`${baseUrl}/api/market/stocks/SENSEX?exchange=BSE`, {
        headers: { Cookie: `finora_access=${token}` },
      })
      assert.equal(sensex.status, 503)
      assertNoFabricatedQuote(await sensex.json())

      const stocks = await fetch(`${baseUrl}/api/market/stocks?q=NIFTY&exchange=NSE`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert.equal(stocks.status, 200)
      const stocksBody = (await stocks.json()) as { data: { dataSource: string; items: unknown[] } }
      assert.deepEqual(stocksBody.data, { dataSource: 'unconfigured', items: [] })

      const indices = await fetch(`${baseUrl}/api/market/indices`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert.equal(indices.status, 200)
      const indicesBody = (await indices.json()) as { data: { items: unknown[] } }
      assert.deepEqual(indicesBody.data, { items: [] })

      const history = await fetch(`${baseUrl}/api/market/stocks/NIFTY/history?exchange=NSE&interval=1D`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert.equal(history.status, 200)
      const historyBody = (await history.json()) as { data: { candles: unknown[] } }
      assert.deepEqual(historyBody.data, { candles: [] })

      const invalid = await fetch(`${baseUrl}/api/market/stocks/nifty?exchange=NSE`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert.equal(invalid.status, 400)
      assertNoFabricatedQuote(await invalid.json())
    })

    assert.equal(calls.quote, 0)
    assert.equal(calls.list, 0)
    assert.equal(calls.indices, 0)
    assert.equal(calls.history, 0)
  })

  it('returns a labeled sample quote and an empty real symbol from the mock feed', async () => {
    const provider = createMockProvider({ mode: 'sandbox', nodeEnv: 'test' })
    const app = marketApp(provider)
    const token = accessToken()

    await withServer(app, async (baseUrl) => {
      const sample = await fetch(`${baseUrl}/api/market/stocks/SMPLBANK?exchange=SAMPLE`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert.equal(sample.status, 200)
      const sampleBody = (await sample.json()) as { data: NormalizedTick }
      assert.equal(sampleBody.data.symbol, 'SMPLBANK')
      assert.equal(sampleBody.data.exchange, 'SAMPLE')
      assert.equal(sampleBody.data.source, 'mock')
      assert.equal(sampleBody.data.label, sampleDataLabel)

      const nifty = await fetch(`${baseUrl}/api/market/stocks/NIFTY?exchange=NSE`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert.equal(nifty.status, 200)
      const niftyBody = (await nifty.json()) as { success: boolean; data: null }
      assert.equal(niftyBody.success, true)
      assert.equal(niftyBody.data, null)
      assertNoFabricatedQuote(niftyBody)

      const sensex = await fetch(`${baseUrl}/api/market/stocks/SENSEX?exchange=BSE`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert.equal(sensex.status, 200)
      const sensexBody = (await sensex.json()) as { data: null }
      assert.equal(sensexBody.data, null)
      assertNoFabricatedQuote(sensexBody)
    })
  })

  it('keeps the API health check simulated and the dashboard route mounted', async () => {
    const app = createApp()
    const token = accessToken()

    await withServer(app, async (baseUrl) => {
      const health = await fetch(`${baseUrl}/api/health`)
      assert.equal(health.status, 200)
      const healthBody = (await health.json()) as {
        data: { marketData: string; integrations: Array<{ id: string; status: string }> }
      }
      assert.equal(healthBody.data.marketData, 'simulated')
      const marketData = healthBody.data.integrations.find((item) => item.id === 'market-data')
      assert.ok(marketData)
      assert.equal(marketData.status, 'not_configured')

      const dashboard = await fetch(`${baseUrl}/api/dashboard`)
      assert.equal(dashboard.status, 401)

      const quote = await fetch(`${baseUrl}/api/market/stocks/NIFTY?exchange=NSE`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert.equal(quote.status, 503)
      const quoteBody = (await quote.json()) as { code: string }
      assert.equal(quoteBody.code, 'MARKET_FEED_UNAVAILABLE')
      assertNoFabricatedQuote(quoteBody)
    })
  })
})

describe('default market provider', () => {
  it('does not fabricate NIFTY or SENSEX', async () => {
    const provider = createMarketDataProvider({ nodeEnv: 'test', provider: 'none', mode: 'sandbox' })
    const market = createMarketRuntime({
      provider,
      cache: createMemoryQuoteCache(memoryQuoteCacheLabel),
    })
    assert.equal(market.getHealth().connection, 'unconfigured')
    assert.equal(await market.getStock('NIFTY', 'NSE'), null)
    assert.equal(await market.getStock('SENSEX', 'BSE'), null)
    assert.deepEqual(await market.listIndices(), { items: [] })
  })
})
