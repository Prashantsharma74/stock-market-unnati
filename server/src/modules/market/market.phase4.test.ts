import assert from 'node:assert/strict'
import http from 'node:http'
import { after, before, describe, it } from 'node:test'
import cookieParser from 'cookie-parser'
import express, { type Express } from 'express'
import { errorHandler } from '../../middleware/errorHandler'
import { signAccessToken } from '../../utils/tokens'
import { createMarketDataProvider } from './createProvider'
import type { MarketDataProvider } from './market.provider'
import { createMarketRouter } from './market.routes'
import { createMarketRuntime } from './market.service'
import type { NormalizedTick } from './market.types'
import { createMemoryQuoteCache, memoryQuoteCacheLabel } from './redisQuotes'
import { createSubscriptionRegistry } from './subscriptionRegistry'
import { createMockProvider } from './providers/mock.provider'
import { createTrueDataProvider, trueDataUnverifiedMessage, type TrueDataSocketFactory } from './providers/truedata.provider'

const realNames = ['NIFTY', 'SENSEX', 'RELIANCE', 'TCS'] as const

describe('TrueData market adapter', () => {
  const originalWebSocket = globalThis.WebSocket
  let nativeSockets = 0

  before(() => {
    class CountingSocket {
      constructor() {
        nativeSockets += 1
      }
      close() {}
    }
    globalThis.WebSocket = CountingSocket as unknown as typeof WebSocket
  })

  after(() => {
    globalThis.WebSocket = originalWebSocket
  })

  function recordingSocket(): { factory: TrueDataSocketFactory; opened: () => number } {
    let opened = 0
    return {
      opened: () => opened,
      factory(url) {
        opened += 1
        void url
        return { close() {} }
      },
    }
  }

  it('does not construct a live socket when TrueData secrets are missing', async () => {
    const sockets = recordingSocket()
    const attempts = [
      { username: '', password: '' },
      { username: '   ', password: '   ' },
      { username: 'desk', password: '' },
      { username: '', password: 'secret' },
    ]

    for (const attempt of attempts) {
      const provider = createMarketDataProvider({
        nodeEnv: 'production',
        provider: 'truedata',
        mode: 'sandbox',
        username: attempt.username,
        password: attempt.password,
        socketFactory: sockets.factory,
      })
      assert.equal(provider.id, 'none')
      assert.equal(provider.getStatus().provider, 'none')
      assert.equal(provider.getStatus().connection, 'unconfigured')
      assert.equal(provider.getStatus().configured, false)
      assert.match(provider.getStatus().message, /not configured/)
      await provider.start()
      assert.equal(await provider.getQuote('NIFTY', 'NSE'), null)
      assert.equal(await provider.getQuote('SENSEX', 'BSE'), null)
      assert.deepEqual(await provider.getIndices(), [])
      await provider.stop()
    }

    assert.throws(
      () =>
        createTrueDataProvider({
          mode: 'sandbox',
          username: 'desk',
          password: ' ',
          socketFactory: sockets.factory,
        }),
      /without both secrets/,
    )
    assert.equal(sockets.opened(), 0)
    assert.equal(nativeSockets, 0)
  })

  it('does not return a fabricated quote when TrueData credentials are set', async () => {
    const sockets = recordingSocket()
    const provider = createMarketDataProvider({
      nodeEnv: 'production',
      provider: 'truedata',
      mode: 'production',
      username: 'desk',
      password: 'secret',
      socketFactory: sockets.factory,
    })
    const seen: NormalizedTick[] = []
    const unsubscribe = provider.onTick((tick) => {
      seen.push(tick)
    })

    try {
      assert.equal(provider.id, 'truedata')
      await provider.start()
      const status = provider.getStatus()
      assert.equal(status.provider, 'truedata')
      assert.equal(status.mode, 'production')
      assert.equal(status.connection, 'disconnected')
      assert.equal(status.configured, true)
      assert.equal(status.message, trueDataUnverifiedMessage)

      for (const symbol of realNames) {
        assert.equal(await provider.getQuote(symbol, 'NSE'), null)
        assert.equal(await provider.getQuote(symbol, 'BSE'), null)
        assert.deepEqual(await provider.listQuotes({ q: symbol }), [])
        assert.deepEqual(await provider.listQuotes({ q: symbol, exchange: 'NSE' }), [])
        assert.deepEqual(await provider.getHistory(symbol, 'NSE', '1D'), [])
        assert.deepEqual(await provider.getHistory(symbol, 'BSE', '1Y'), [])
        await provider.subscribe(symbol, 'NSE')
        await provider.subscribe(symbol, 'BSE')
      }

      assert.equal(await provider.getQuote('SMPLBANK', 'SAMPLE'), null)
      assert.deepEqual(await provider.getIndices(), [])
      assert.deepEqual(await provider.listQuotes({}), [])
      await provider.stop()
      assert.equal(await provider.getQuote('NIFTY', 'NSE'), null)
      assert.equal(provider.getStatus().connection, 'disconnected')
      assert.deepEqual(seen, [])
      assert.equal(sockets.opened(), 0)
      assert.equal(nativeSockets, 0)
    } finally {
      unsubscribe()
      await provider.stop()
    }
  })

  it('keeps duplicate TrueData subscriptions on one registry call and emits nothing', async () => {
    const sockets = recordingSocket()
    const provider = createTrueDataProvider({
      mode: 'sandbox',
      username: 'desk',
      password: 'secret',
      socketFactory: sockets.factory,
    })
    let subscribeCalls = 0
    const wrapped: MarketDataProvider = {
      ...provider,
      async subscribe(symbol, exchange) {
        subscribeCalls += 1
        await provider.subscribe(symbol, exchange)
      },
      async unsubscribe(symbol, exchange) {
        await provider.unsubscribe(symbol, exchange)
      },
    }
    const registry = createSubscriptionRegistry(wrapped)
    const seen: NormalizedTick[] = []
    const unsubscribe = provider.onTick((tick) => {
      seen.push(tick)
    })

    try {
      await provider.start()
      assert.equal(await registry.subscribe('NIFTY', 'NSE'), 1)
      assert.equal(await registry.subscribe('nifty', 'NSE'), 2)
      assert.equal(await registry.subscribe('NIFTY', 'NSE'), 3)
      assert.equal(subscribeCalls, 1)
      assert.equal(await provider.getQuote('NIFTY', 'NSE'), null)
      assert.equal(await provider.getQuote('SENSEX', 'BSE'), null)
      assert.deepEqual(seen, [])
      assert.equal(sockets.opened(), 0)
      assert.equal(nativeSockets, 0)
    } finally {
      unsubscribe()
      await provider.stop()
    }
  })

  it('returns 503 and empty lists while the TrueData handshake is unverified', async () => {
    const sockets = recordingSocket()
    const provider = createTrueDataProvider({
      mode: 'sandbox',
      username: 'desk',
      password: 'secret',
      socketFactory: sockets.factory,
    })
    const runtime = createMarketRuntime({
      provider,
      cache: createMemoryQuoteCache(memoryQuoteCacheLabel),
    })
    await runtime.start()
    const app = marketApp(runtime)
    const token = signAccessToken({
      sub: '507f1f77bcf86cd799439011',
      role: 'user',
      email: 'phase4@example.com',
    })

    try {
      assert.equal(runtime.getHealth().connection, 'disconnected')
      assert.equal(runtime.getHealth().provider, 'truedata')
      assert.deepEqual(await runtime.listStocks({ q: 'NIFTY', exchange: 'NSE' }), { dataSource: 'unconfigured', items: [] })
      assert.equal(await runtime.getStock('SENSEX', 'BSE'), null)

      await withServer(app, async (baseUrl) => {
        const health = await fetch(`${baseUrl}/api/market/health`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        assert.equal(health.status, 200)
        const healthBody = (await health.json()) as { data: { connection: string; provider: string; message: string } }
        assert.equal(healthBody.data.provider, 'truedata')
        assert.equal(healthBody.data.connection, 'disconnected')
        assert.equal(healthBody.data.message, trueDataUnverifiedMessage)
        assert.equal(JSON.stringify(healthBody).includes('"ltp"'), false)

        const quote = await fetch(`${baseUrl}/api/market/stocks/NIFTY?exchange=NSE`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        assert.equal(quote.status, 503)
        const quoteBody = (await quote.json()) as { success: boolean; code: string; data?: unknown }
        assert.equal(quoteBody.success, false)
        assert.equal(quoteBody.code, 'MARKET_FEED_UNAVAILABLE')
        assert.equal(Object.hasOwn(quoteBody, 'data'), false)
        assert.equal(JSON.stringify(quoteBody).includes('"ltp"'), false)

        const indices = await fetch(`${baseUrl}/api/market/indices`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        assert.equal(indices.status, 200)
        const indicesBody = (await indices.json()) as { data: { items: unknown[] } }
        assert.deepEqual(indicesBody.data.items, [])
      })
      assert.equal(sockets.opened(), 0)
      assert.equal(nativeSockets, 0)
    } finally {
      await runtime.stop()
    }
  })
})

describe('production mock provider', () => {
  it('does not construct the mock provider in production', async () => {
    assert.throws(
      () => createMockProvider({ mode: 'production', nodeEnv: 'production' }),
      /Refusing to construct the mock market provider in production/,
    )

    const provider = createMarketDataProvider({
      nodeEnv: 'production',
      provider: 'mock',
      mode: 'production',
    })
    const seen: NormalizedTick[] = []
    const unsubscribe = provider.onTick((tick) => {
      seen.push(tick)
    })

    try {
      assert.equal(provider.id, 'none')
      assert.equal(provider.getStatus().connection, 'unconfigured')
      assert.equal(provider.getStatus().configured, false)
      assert.equal(await provider.getQuote('NIFTY', 'NSE'), null)
      assert.equal(await provider.getQuote('SMPLBANK', 'SAMPLE'), null)
      assert.deepEqual(await provider.getIndices(), [])
      await provider.start()
      assert.deepEqual(seen, [])
    } finally {
      unsubscribe()
      await provider.stop()
    }
  })
})

function marketApp(runtime: ReturnType<typeof createMarketRuntime>) {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/market', createMarketRouter(runtime))
  app.use(errorHandler)
  return app
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
