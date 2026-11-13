import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createMarketDataProvider } from './createProvider'
import type { NormalizedTick } from './market.types'
import { createMockProvider } from './providers/mock.provider'
import { sampleDataLabel, sampleIndexes, sampleStocks } from './sampleSymbols'

const realNames = ['NIFTY', 'NIFTY50', 'SENSEX', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY'] as const

describe('market data provider', () => {
  it('labels mock ticks as sample data', async () => {
    const provider = createMarketDataProvider({ nodeEnv: 'test', provider: 'mock', mode: 'sandbox' })
    const seen: NormalizedTick[] = []
    const unsubscribe = provider.onTick((tick) => {
      seen.push(tick)
    })

    try {
      assert.equal(provider.id, 'mock')
      const status = provider.getStatus()
      assert.equal(status.provider, 'mock')
      assert.equal(status.connection, 'mock')
      assert.equal(status.message, sampleDataLabel)

      const quote = await provider.getQuote('smplbank', 'SAMPLE')
      assert.ok(quote)
      assert.equal(quote.symbol, 'SMPLBANK')
      assert.equal(quote.exchange, 'SAMPLE')
      assert.equal(quote.kind, 'stock')
      assert.equal(quote.source, 'mock')
      assert.equal(quote.label, 'Sample data. Not an NSE or BSE quote.')
      assert.equal(quote.ltp, 842.5)
      assert.equal(Number.isNaN(Date.parse(quote.ts)), false)

      const quotes = await provider.listQuotes({})
      assert.deepEqual(
        quotes.map((item) => item.symbol),
        [...sampleStocks],
      )
      for (const item of quotes) {
        assert.equal(item.exchange, 'SAMPLE')
        assert.equal(item.source, 'mock')
        assert.equal(item.label, sampleDataLabel)
      }

      const indices = await provider.getIndices()
      assert.deepEqual(
        indices.map((item) => item.symbol),
        [...sampleIndexes],
      )
      for (const item of indices) {
        assert.equal(item.kind, 'index')
        assert.equal(item.exchange, 'SAMPLE')
        assert.equal(item.source, 'mock')
        assert.equal(item.label, sampleDataLabel)
      }

      const history = await provider.getHistory('SAMPLE50', 'SAMPLE', '1W')
      assert.ok(history.length > 0)
      for (const candle of history) {
        assert.equal(candle.symbol, 'SAMPLE50')
        assert.equal(candle.exchange, 'SAMPLE')
        assert.equal(candle.source, 'mock')
        assert.equal(candle.label, sampleDataLabel)
      }

      await provider.subscribe('SMPLBANK', 'SAMPLE')
      await provider.start()
      assert.equal(seen.length, 1)
      assert.equal(seen[0].symbol, 'SMPLBANK')
      assert.equal(seen[0].exchange, 'SAMPLE')
      assert.equal(seen[0].source, 'mock')
      assert.equal(seen[0].label, sampleDataLabel)
    } finally {
      await provider.stop()
      unsubscribe()
    }
  })

  it('returns empty results for unknown symbols', async () => {
    const provider = createMarketDataProvider({ nodeEnv: 'development', provider: 'mock', mode: 'sandbox' })
    const seen: NormalizedTick[] = []
    const unsubscribe = provider.onTick((tick) => {
      seen.push(tick)
    })

    try {
      for (const symbol of realNames) {
        assert.equal(await provider.getQuote(symbol, 'NSE'), null)
        assert.equal(await provider.getQuote(symbol, 'BSE'), null)
        assert.equal(await provider.getQuote(symbol, 'SAMPLE'), null)
        assert.deepEqual(await provider.listQuotes({ q: symbol }), [])
        assert.deepEqual(await provider.listQuotes({ q: symbol, exchange: 'NSE' }), [])
        assert.deepEqual(await provider.getHistory(symbol, 'NSE', '1D'), [])
        assert.deepEqual(await provider.getHistory(symbol, 'BSE', '1Y'), [])
        assert.deepEqual(await provider.getHistory(symbol, 'SAMPLE', '5Y'), [])
        await provider.subscribe(symbol, 'NSE')
        await provider.subscribe(symbol, 'BSE')
        await provider.subscribe(symbol, 'SAMPLE')
      }

      assert.equal(await provider.getQuote('SMPLBANK', 'NSE'), null)
      assert.equal(await provider.getQuote('SMPLBANK', 'BSE'), null)
      assert.deepEqual(await provider.listQuotes({ q: 'SMPLBANK', exchange: 'NSE' }), [])
      assert.deepEqual(await provider.getHistory('SMPLBANK', 'NSE', '1M'), [])

      await provider.start()
      assert.deepEqual(seen, [])
      const indices = await provider.getIndices()
      assert.equal(
        indices.some((item) => realNames.includes(item.symbol as (typeof realNames)[number])),
        false,
      )
    } finally {
      await provider.stop()
      unsubscribe()
    }
  })

  it('does not construct the mock provider in production', async () => {
    assert.throws(
      () => createMockProvider({ mode: 'sandbox', nodeEnv: 'production' }),
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
      const status = provider.getStatus()
      assert.equal(status.provider, 'none')
      assert.equal(status.connection, 'unconfigured')
      assert.equal(status.configured, false)
      assert.equal(status.mode, 'production')
      assert.match(status.message, /disabled in production/)
      assert.equal(await provider.getQuote('SMPLBANK', 'SAMPLE'), null)
      assert.equal(await provider.getQuote('NIFTY', 'NSE'), null)
      assert.deepEqual(await provider.listQuotes({}), [])
      assert.deepEqual(await provider.getIndices(), [])
      assert.deepEqual(await provider.getHistory('SMPLBANK', 'SAMPLE', '1D'), [])
      await provider.subscribe('SMPLBANK', 'SAMPLE')
      await provider.subscribe('NIFTY', 'NSE')
      await provider.start()
      assert.deepEqual(seen, [])
    } finally {
      await provider.stop()
      unsubscribe()
    }
  })

  it('keeps TrueData and an explicit none provider unconfigured', async () => {
    const selected = createMarketDataProvider({ nodeEnv: 'test', provider: 'none', mode: 'sandbox' })
    assert.equal(selected.id, 'none')
    assert.equal(selected.getStatus().connection, 'unconfigured')
    assert.match(selected.getStatus().message, /not installed/)
    assert.equal(await selected.getQuote('NIFTY', 'NSE'), null)
    assert.equal(await selected.getQuote('SENSEX', 'BSE'), null)

    for (const providerName of ['none', 'truedata'] as const) {
      const provider = createMarketDataProvider({
        nodeEnv: 'development',
        provider: providerName,
        mode: 'sandbox',
        username: '',
        password: '',
      })
      assert.equal(provider.id, 'none')
      assert.equal(provider.getStatus().configured, false)
      assert.equal(provider.getStatus().connection, 'unconfigured')
      assert.match(provider.getStatus().message, providerName === 'truedata' ? /not configured/ : /not installed/)
      assert.equal(await provider.getQuote('RELIANCE', 'NSE'), null)
      assert.deepEqual(await provider.getIndices(), [])
      assert.deepEqual(await provider.listQuotes({ q: 'TCS' }), [])
    }
  })
})
