import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createMarketDataProvider } from './createProvider'
import { createInfowayProvider, infowayKeyMissingMessage, infowayLastTradeLabel, type InfowaySocket } from './providers/infoway.provider'

const documentedTrade = {
  ret: 200,
  msg: 'success',
  data: [
    {
      s: 'AAPL.US',
      t: 1750177346523,
      p: '298.310',
      v: '100',
      vw: '29831.000',
      td: 0,
    },
  ],
}

describe('Infoway market adapter', () => {
  it('does not create a provider that returns prices when the API key is missing', async () => {
    let fetches = 0
    const fetchImpl = async () => {
      fetches += 1
      throw new Error('missing key must not fetch')
    }

    for (const apiKey of ['', '   ']) {
      const provider = createMarketDataProvider({
        nodeEnv: 'test',
        provider: 'infoway',
        mode: 'sandbox',
        apiKey,
        infowayFetch: fetchImpl,
      })
      assert.equal(provider.id, 'none')
      assert.equal(provider.getStatus().provider, 'none')
      assert.equal(provider.getStatus().connection, 'unconfigured')
      assert.equal(provider.getStatus().configured, false)
      assert.equal(provider.getStatus().message, infowayKeyMissingMessage)
      assert.equal(await provider.getQuote('AAPL', 'US'), null)
      assert.equal(await provider.getQuote('NIFTY', 'NSE'), null)
      assert.equal(await provider.getQuote('SENSEX', 'BSE'), null)
      assert.deepEqual(await provider.listQuotes({}), [])
      assert.deepEqual(await provider.listQuotes({ q: 'AAPL', exchange: 'US' }), [])
      assert.deepEqual(await provider.getIndices(), [])
      assert.deepEqual(await provider.getHistory('AAPL', 'US', '1D'), [])
      await provider.subscribe('AAPL', 'US')
      await provider.start()
      await provider.stop()
    }

    assert.throws(() => createInfowayProvider({ mode: 'sandbox', apiKey: ' ' }), /without an API key/)
    assert.equal(fetches, 0)
  })

  it('keeps a documented US trade on US and does not invent an NSE price', async () => {
    let fetches = 0
    const provider = createInfowayProvider({
      mode: 'sandbox',
      apiKey: 'test-key',
      fetchImpl: async (input) => {
        fetches += 1
        assert.equal(input.url, 'https://data.infoway.io/stock/batch_trade/AAPL.US')
        assert.equal(input.url.includes('test-key'), false)
        assert.equal(input.apiKey, 'test-key')
        return { status: 200, body: JSON.stringify(documentedTrade) }
      },
      socketFactory() {
        throw new Error('quote fetch must not open a socket')
      },
    })

    const tick = await provider.getQuote('AAPL', 'US')
    assert.ok(tick)
    assert.equal(tick.symbol, 'AAPL')
    assert.equal(tick.exchange, 'US')
    assert.equal(tick.source, 'provider')
    assert.equal(tick.ltp, 298.31)
    assert.equal(tick.ts, new Date(1750177346523).toISOString())
    assert.equal(tick.label, infowayLastTradeLabel)
    assert.equal(provider.getStatus().connection, 'connected')
    assert.equal(provider.getStatus().message.includes('test-key'), false)

    const cached = await provider.getQuote('AAPL', 'US')
    assert.equal(cached?.ltp, 298.31)
    assert.equal(await provider.getQuote('NIFTY', 'NSE'), null)
    assert.equal(await provider.getQuote('MSFT', 'US'), null)
    assert.deepEqual(await provider.listQuotes({ exchange: 'NSE' }), [])
    assert.deepEqual(await provider.getIndices(), [])
    assert.equal(fetches, 1)
  })

  it('does not retry an authentication failure or open a socket', async () => {
    let fetches = 0
    const provider = createInfowayProvider({
      mode: 'sandbox',
      apiKey: 'test-key',
      fetchImpl: async () => {
        fetches += 1
        return { status: 401, body: '{"msg":"bad test-key"}' }
      },
      socketFactory() {
        throw new Error('auth failure must not open a socket')
      },
    })

    assert.equal(await provider.getQuote('AAPL', 'US'), null)
    assert.equal(await provider.getQuote('AAPL', 'US'), null)
    assert.equal(provider.getStatus().connection, 'disconnected')
    assert.match(provider.getStatus().message, /authentication failed/i)
    assert.equal(provider.getStatus().message.includes('test-key'), false)
    assert.equal(fetches, 1)
  })

  it('uses one WebSocket and stops at 10 subscriptions', async () => {
    const sockets: InfowaySocket[] = []
    let fetches = 0
    const provider = createInfowayProvider({
      mode: 'sandbox',
      apiKey: 'test-key',
      fetchImpl: async () => {
        fetches += 1
        throw new Error('subscription cap must not fetch')
      },
      socketFactory(url) {
        assert.equal(url.startsWith('wss://data.infoway.io/ws?business=stock&apikey='), true)
        const socket: InfowaySocket = {
          send() {},
          close() {},
          addEventListener() {},
        }
        sockets.push(socket)
        return socket
      },
    })
    const seen: string[] = []
    provider.onTick((tick) => {
      seen.push(tick.symbol)
    })

    try {
      for (let index = 0; index < 10; index += 1) {
        await provider.subscribe(`SYM${index}`, 'US')
      }
      await assert.rejects(() => provider.subscribe('EXTRA', 'US'), /10 WebSocket subscriptions/)
      await assert.rejects(() => provider.subscribe('ABC', 'IN'), /one WebSocket connection/)
      assert.equal(sockets.length, 1)
      assert.equal(fetches, 0)
      assert.deepEqual(seen, [])
      assert.equal(await provider.getQuote('NIFTY', 'NSE'), null)
    } finally {
      await provider.stop()
    }
  })
})
