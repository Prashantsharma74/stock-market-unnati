import { randomUUID } from 'crypto'
import { logger } from '../../../utils/logger'
import type { MarketDataProvider } from '../market.provider'
import type { MarketExchange, MarketStatus, NormalizedTick } from '../market.types'
import { isInfowayExchange, type InfowayExchange } from '../market.types'

// Documented hosts and protocols:
// https://docs.infoway.io/en-docs/getting-started/endpoints
// https://docs.infoway.io/en-docs/rest-api/market-data/get-latest-trade
// https://docs.infoway.io/en-docs/websocket/websocket-subscribe-method/latest-trade-subscription
// https://docs.infoway.io/en-docs/websocket/heartbeat
// https://docs.infoway.io/en-docs/getting-started/api-limitation/websocket-limitation
// Free plan: 1 HTTP request/second, 1 WebSocket connection, 10 symbols.
// India uses suffix .IN and /india/batch_trade, but the symbol table gives no sample code.
// This adapter does not invent an Indian symbol or an NSE/BSE label.

const httpOrigin = 'https://data.infoway.io'
const wsOrigin = 'wss://data.infoway.io/ws'
const maxWebsocketSubscriptions = 10
const minHttpIntervalMs = 1100
const quoteCacheMs = 60_000
const heartbeatMs = 30_000

const documentedEquity = { symbol: 'AAPL', exchange: 'US' as const }

export const infowayLastTradeLabel = 'Infoway last trade. Previous close was not included.'
export const infowayKeyMissingMessage = 'Infoway API key is not configured.'

const routes = {
  US: { business: 'stock', path: 'stock', suffix: 'US' },
  HK: { business: 'stock', path: 'stock', suffix: 'HK' },
  SH: { business: 'stock', path: 'stock', suffix: 'SH' },
  SZ: { business: 'stock', path: 'stock', suffix: 'SZ' },
  JP: { business: 'japan', path: 'japan', suffix: 'JP' },
  KS: { business: 'korea', path: 'korea', suffix: 'KS' },
  IN: { business: 'india', path: 'india', suffix: 'IN' },
  TW: { business: 'taiwan', path: 'taiwan', suffix: 'TW' },
} as const

type Business = (typeof routes)[InfowayExchange]['business']

export type InfowayFetch = (input: { url: string; apiKey: string }) => Promise<{ status: number; body: string }>

export type InfowaySocket = {
  send(data: string): void
  close(): void
  addEventListener(type: 'message' | 'close' | 'error', listener: (event: { data?: unknown }) => void): void
}

export type InfowaySocketFactory = (url: string) => InfowaySocket

type FeedState = 'idle' | 'live' | 'auth' | 'rate' | 'error'

type StoredQuote = { tick: NormalizedTick; at: number }

function traceId() {
  return randomUUID().replaceAll('-', '')
}

function redact(value: string, apiKey: string) {
  let next = value
  const secret = apiKey.trim()
  if (secret) {
    next = next.split(secret).join('[redacted]')
    const encoded = encodeURIComponent(secret)
    if (encoded !== secret) next = next.split(encoded).join('[redacted]')
  }
  return next.replace(/\s+/g, ' ').trim().slice(0, 240)
}

function unrefTimer(timer: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>) {
  if (typeof timer.unref === 'function') timer.unref()
}

function localSymbol(symbol: string, exchange: InfowayExchange) {
  const name = symbol.trim().toUpperCase()
  if (!/^[A-Z0-9-]{1,20}$/.test(name)) return null
  if (exchange === 'HK' && /^\d{1,5}$/.test(name)) return name.padStart(5, '0')
  return name
}

function toRequest(symbol: string, exchange: MarketExchange) {
  if (!isInfowayExchange(exchange)) return null
  const local = localSymbol(symbol, exchange)
  if (!local) return null
  const route = routes[exchange]
  return { code: `${local}.${route.suffix}`, path: route.path, business: route.business }
}

function splitCode(code: string) {
  const upper = code.trim().toUpperCase()
  const dot = upper.lastIndexOf('.')
  if (dot <= 0) return null
  const symbol = upper.slice(0, dot)
  const suffix = upper.slice(dot + 1)
  if (!isInfowayExchange(suffix) || !/^[A-Z0-9-]{1,20}$/.test(symbol)) return null
  return { symbol, exchange: suffix }
}

function parseDecimal(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !/^[+-]?\d+(\.\d+)?$/.test(value.trim())) return null
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : null
}

function parseTradeTime(value: unknown) {
  const time = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value.trim()) : Number.NaN
  if (!Number.isFinite(time) || time <= 0) return null
  const ms = time < 1_000_000_000_000 ? time * 1000 : time
  const iso = new Date(ms).toISOString()
  return Number.isNaN(Date.parse(iso)) ? null : iso
}

function parsePercentChange(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const cleaned = value.trim().replace(/%$/, '')
  if (!/^[+-]?\d+(\.\d+)?$/.test(cleaned)) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function tradeFromFields(
  identity: { symbol: string; exchange: MarketExchange },
  fields: Record<string, unknown>,
): NormalizedTick | null {
  const ltp = parseDecimal(fields.p) ?? parseDecimal(fields.c)
  const ts = parseTradeTime(fields.t)
  if (ltp === null || !ts) return null
  const volume = parseDecimal(fields.v)
  const pca = parsePercentChange(fields.pca)
  const pcField = parseDecimal(fields.pc)
  const ycp = parseDecimal(fields.ycp) ?? parseDecimal(fields.pcl) ?? parseDecimal(fields.yc)
  let changePct = pca ?? 0
  let previousClose = ycp ?? ltp
  if (pca !== null && Number.isFinite(pca) && pca !== 0) {
    previousClose = ltp / (1 + pca / 100)
    changePct = pca
  } else if (ycp !== null && ycp > 0 && ycp !== ltp) {
    previousClose = ycp
    changePct = ((ltp - ycp) / ycp) * 100
  } else if (pcField !== null && pcField > 0 && pcField !== ltp && Math.abs(pcField - ltp) / ltp < 0.5) {
    previousClose = pcField
    changePct = ((ltp - pcField) / pcField) * 100
  }
  const change = ltp - previousClose
  return {
    symbol: identity.symbol,
    exchange: identity.exchange,
    kind: 'stock',
    ltp,
    previousClose,
    change,
    changePct,
    ...(volume === null ? {} : { volume }),
    ts,
    source: 'provider',
    label: infowayLastTradeLabel,
  }
}

export function parseInfowayTrade(row: unknown): NormalizedTick | null {
  if (!row || typeof row !== 'object') return null
  const record = row as Record<string, unknown>
  if (typeof record.s !== 'string') return null
  const identity = splitCode(record.s)
  if (!identity) return null

  if (Array.isArray(record.respList) && record.respList.length > 0 && record.respList[0] && typeof record.respList[0] === 'object') {
    return tradeFromFields(identity, record.respList[0] as Record<string, unknown>)
  }

  return tradeFromFields(identity, record)
}

function readEnvelope(body: string) {
  try {
    const parsed: unknown = JSON.parse(body)
    if (!parsed || typeof parsed !== 'object') return { ret: null as number | null, msg: body, data: null as unknown }
    const record = parsed as Record<string, unknown>
    return {
      ret: typeof record.ret === 'number' ? record.ret : null,
      msg: typeof record.msg === 'string' ? record.msg : '',
      data: record.data,
    }
  } catch {
    return { ret: null as number | null, msg: body, data: null as unknown }
  }
}

function isAuthFailure(httpStatus: number, ret: number | null, msg: string) {
  if (httpStatus === 401 || ret === 509) return true
  return ret === 500 && /apikey/i.test(msg)
}

function isRateFailure(httpStatus: number, ret: number | null, msg: string) {
  if (httpStatus === 429 || ret === 501 || ret === 502) return true
  return /rate limit/i.test(msg) || /frequency exceed/i.test(msg)
}

async function textFrom(data: unknown) {
  if (typeof data === 'string') return data
  if (Buffer.isBuffer(data)) return data.toString('utf8')
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8')
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8')
  if (data && typeof data === 'object' && 'text' in data && typeof data.text === 'function') {
    return data.text()
  }
  return ''
}

function defaultFetch(input: { url: string; apiKey: string }) {
  return fetch(input.url, {
    method: 'GET',
    headers: { apiKey: input.apiKey, Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  }).then(async (response) => ({ status: response.status, body: await response.text() }))
}

function defaultSocket(url: string): InfowaySocket {
  const live = new WebSocket(url)
  return {
    send(data) {
      live.send(data)
    },
    close() {
      live.close()
    },
    addEventListener(type, listener) {
      live.addEventListener(type, (event) => {
        const record = event as { data?: unknown }
        listener({ data: record.data })
      })
    },
  }
}

export function createInfowayProvider(options: {
  mode: MarketStatus['mode']
  apiKey: string
  fetchImpl?: InfowayFetch
  socketFactory?: InfowaySocketFactory
}): MarketDataProvider {
  const apiKey = options.apiKey.trim()
  if (!apiKey) throw new Error('Refusing to construct the Infoway provider without an API key.')

  const mode = options.mode
  const fetchImpl = options.fetchImpl ?? defaultFetch
  const socketFactory = options.socketFactory ?? defaultSocket
  const quotes = new Map<string, StoredQuote>()
  const denied = new Set<string>()
  const subscriptions = new Set<string>()
  const listeners = new Set<(tick: NormalizedTick) => void>()
  const frameTimes: number[] = []

  let state: FeedState = 'idle'
  let detail = 'Infoway key is set. No live trade has been received yet.'
  let authBlocked = false
  let lastHttpAt = 0
  let inFlight: Promise<void> | null = null
  let socket: InfowaySocket | null = null
  let business: Business | null = null
  let ready = false
  let stopped = false
  let preventReconnect = false
  let reconnects = 0
  let heartbeat: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  function quoteKey(tick: NormalizedTick) {
    return `${tick.exchange}:${tick.symbol}`
  }

  function codeFor(tick: NormalizedTick) {
    return `${tick.symbol}.${tick.exchange}`
  }

  function remember(tick: NormalizedTick) {
    quotes.set(quoteKey(tick), { tick, at: Date.now() })
    state = 'live'
    detail = 'Infoway returned a live trade.'
  }

  function readFresh(code: string) {
    if (state === 'auth' || state === 'rate') return null
    const identity = splitCode(code)
    if (!identity) return null
    const stored = quotes.get(`${identity.exchange}:${identity.symbol}`)
    if (!stored) return null
    if (Date.now() - stored.at > quoteCacheMs) return null
    return stored.tick
  }

  function allowFrame() {
    const now = Date.now()
    while (frameTimes.length > 0 && frameTimes[0] !== undefined && now - frameTimes[0] >= 60_000) frameTimes.shift()
    if (frameTimes.length >= 50) return false
    frameTimes.push(now)
    return true
  }

  function sendRaw(payload: unknown) {
    if (!socket || !ready || !allowFrame()) return
    socket.send(JSON.stringify(payload))
  }

  function startHeartbeat() {
    if (heartbeat) clearInterval(heartbeat)
    heartbeat = setInterval(() => {
      if (!ready || !socket) return
      sendRaw({ code: 10010, trace: traceId() })
    }, heartbeatMs)
    unrefTimer(heartbeat)
  }

  function stopHeartbeat() {
    if (!heartbeat) return
    clearInterval(heartbeat)
    heartbeat = null
  }

  function flushSubscriptions() {
    if (!subscriptions.size) return
    sendRaw({ code: 10000, trace: traceId(), data: { codes: [...subscriptions].join(',') } })
  }

  function closeSocket(intentional: boolean) {
    if (intentional) preventReconnect = true
    ready = false
    stopHeartbeat()
    const current = socket
    socket = null
    current?.close()
  }

  function scheduleReconnect() {
    if (stopped || preventReconnect || authBlocked || reconnects >= 1 || !business || subscriptions.size === 0) return
    reconnects += 1
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      if (stopped || !business || subscriptions.size === 0 || socket) return
      openSocket(business)
    }, 5000)
    unrefTimer(reconnectTimer)
  }

  async function handleMessage(data: unknown) {
    const text = await textFrom(data)
    if (!text) return
    if (text.startsWith('Subscribe fail:')) {
      if (state !== 'live') detail = `Infoway websocket subscription was rejected. ${redact(text, apiKey)}`
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return
    }
    if (!parsed || typeof parsed !== 'object') return
    const record = parsed as Record<string, unknown>
    const code = typeof record.code === 'number' ? record.code : null

    if (code === 200) {
      ready = true
      flushSubscriptions()
      startHeartbeat()
      return
    }
    if (code === 10011 || code === 10001 || code === 11010) return
    if (code === 10002) {
      const tick = parseInfowayTrade(record.data)
      if (!tick || !subscriptions.has(codeFor(tick))) return
      remember(tick)
      for (const listener of [...listeners]) {
        try {
          listener(tick)
        } catch {
          // A listener failure must not replace the trade with a made-up price.
        }
      }
      return
    }
    if (code !== null && [508, 509, 510, 511].includes(code)) {
      authBlocked = true
      state = 'auth'
      preventReconnect = true
      detail = `Infoway websocket authentication failed (code ${code}).`
      closeSocket(true)
      return
    }
    if (code === 501 || code === 502) {
      state = 'rate'
      preventReconnect = true
      detail = `Infoway websocket rate limit reached (code ${code}).`
      closeSocket(true)
      return
    }
    if (code === 512 || code === 505 || code === 516) {
      preventReconnect = true
      detail = `Infoway websocket subscription limit reached (code ${code}).`
      if (code === 512) closeSocket(true)
    }
  }

  function bind(opened: InfowaySocket) {
    opened.addEventListener('message', (event) => {
      void handleMessage(event.data)
    })
    opened.addEventListener('close', () => {
      if (socket !== opened && socket !== null) return
      ready = false
      socket = null
      stopHeartbeat()
      scheduleReconnect()
    })
    opened.addEventListener('error', () => {
      // Close follows. Do not emit a price.
    })
  }

  function openSocket(next: Business) {
    business = next
    ready = false
    preventReconnect = false
    const url = `${wsOrigin}?business=${next}&apikey=${encodeURIComponent(apiKey)}`
    const opened = socketFactory(url)
    socket = opened
    bind(opened)
  }

  function ensureSocket(next: Business) {
    if (socket) return
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    openSocket(next)
  }

  async function requestTradesBatch(codes: string[], path: string, rateRetries = 0): Promise<NormalizedTick[]> {
    if (!codes.length) return []
    lastHttpAt = Date.now()
    const joined = codes.map((code) => code.trim().toUpperCase()).join(',')
    const allowed = new Set(codes.map((code) => code.trim().toUpperCase()))
    let response: { status: number; body: string }
    try {
      response = await fetchImpl({ url: `${httpOrigin}/${path}/batch_trade/${joined}`, apiKey })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (state !== 'live') {
        state = 'error'
        detail = `Infoway request failed before a response. ${redact(message, apiKey)}`
      }
      return []
    }

    const envelope = readEnvelope(response.body)
    const safeBody = redact(envelope.msg || response.body, apiKey)
    if (isAuthFailure(response.status, envelope.ret, envelope.msg)) {
      authBlocked = true
      state = 'auth'
      detail = `Infoway authentication failed (HTTP ${response.status}). ${safeBody}`
      logger.warn('Infoway authentication failed', { status: response.status, ret: envelope.ret })
      return []
    }
    if (isRateFailure(response.status, envelope.ret, envelope.msg)) {
      state = 'rate'
      detail = `Infoway rate limit reached (HTTP ${response.status}). ${safeBody}`
      logger.warn('Infoway rate limit reached', { status: response.status, ret: envelope.ret })
      if (rateRetries < 2) {
        await new Promise((resolve) => setTimeout(resolve, minHttpIntervalMs))
        return requestTradesBatch(codes, path, rateRetries + 1)
      }
      return []
    }
    if (response.status !== 200 || envelope.ret !== 200 || !Array.isArray(envelope.data)) {
      if (envelope.ret === 514 && codes.length > 1) {
        logger.warn('Infoway batch permission mixed; retrying one symbol at a time', {
          count: codes.length,
          msg: safeBody,
        })
        const collected: NormalizedTick[] = []
        for (let index = 0; index < codes.length; index += 1) {
          const code = codes[index]
          if (!code) continue
          if (index > 0) {
            await new Promise((resolve) => setTimeout(resolve, minHttpIntervalMs))
            if (Date.now() - lastHttpAt < minHttpIntervalMs) {
              await new Promise((resolve) => setTimeout(resolve, minHttpIntervalMs - (Date.now() - lastHttpAt)))
            }
          }
          collected.push(...(await requestTradesBatch([code], path)))
        }
        return collected
      }

      for (const code of codes) {
        if (envelope.ret === 508 || envelope.ret === 514 || response.status === 400) denied.add(code)
      }
      if (state !== 'live') {
        state = 'error'
        detail = `Infoway request failed (HTTP ${response.status}${envelope.ret === null ? '' : `, ret ${envelope.ret}`}). ${safeBody}`
      }
      logger.warn('Infoway trade batch failed', { status: response.status, ret: envelope.ret, count: codes.length })
      return []
    }

    const ticks: NormalizedTick[] = []
    for (const row of envelope.data) {
      const tick = parseInfowayTrade(row)
      if (!tick || !allowed.has(codeFor(tick))) continue
      remember(tick)
      ticks.push(tick)
      logger.info('Infoway trade received', {
        symbol: tick.symbol,
        exchange: tick.exchange,
        ltp: tick.ltp,
        ts: tick.ts,
      })
    }
    if (ticks.length > 0) return ticks

    if (codes.length === 1) {
      denied.add(codes[0]!)
      if (state !== 'live') {
        detail = `Infoway returned no trade for ${codes[0]}.`
      }
    }
    return []
  }

  async function requestTrade(code: string, path: string): Promise<NormalizedTick | null> {
    const ticks = await requestTradesBatch([code], path)
    return ticks[0] ?? null
  }

  async function fetchQuoteCandidates(candidates: { symbol: string; exchange: MarketExchange }[]) {
    if (authBlocked || stopped) return []
    const groups = new Map<string, string[]>()
    for (const item of candidates) {
      const request = toRequest(item.symbol, item.exchange)
      if (!request) continue
      const list = groups.get(request.path) ?? []
      list.push(request.code)
      groups.set(request.path, list)
    }

    const ticks: NormalizedTick[] = []
    const seen = new Set<string>()
    for (const [path, codes] of groups) {
      const unique = [...new Set(codes)]
      for (let index = 0; index < unique.length; index += 1) {
        const code = unique[index]
        if (!code) continue
        if (index > 0 || lastHttpAt > 0) {
          await new Promise((resolve) => setTimeout(resolve, minHttpIntervalMs))
          if (Date.now() - lastHttpAt < minHttpIntervalMs) {
            await new Promise((resolve) => setTimeout(resolve, minHttpIntervalMs - (Date.now() - lastHttpAt)))
          }
        }
        const next = await requestTradesBatch([code], path)
        for (const tick of next) {
          const key = quoteKey(tick)
          if (seen.has(key)) continue
          seen.add(key)
          ticks.push(tick)
        }
      }
    }
    return ticks
  }

  async function fetchTrade(code: string, path: string) {
    if (authBlocked || denied.has(code)) return null
    if (state === 'rate' && Date.now() - lastHttpAt < minHttpIntervalMs) return null
    const cached = readFresh(code)
    if (cached) return cached
    if (inFlight) {
      await inFlight
      return readFresh(code)
    }
    if (Date.now() - lastHttpAt < minHttpIntervalMs) return null

    const run = requestTrade(code, path)
    const gate = run.then(
      () => undefined,
      () => undefined,
    )
    inFlight = gate
    try {
      return await run
    } finally {
      if (inFlight === gate) inFlight = null
    }
  }

  async function getQuote(symbol: string, exchange: MarketExchange) {
    const request = toRequest(symbol, exchange)
    if (!request) return null
    return fetchTrade(request.code, request.path)
  }

  return {
    id: 'infoway',
    mode,
    async start() {
      await getQuote(documentedEquity.symbol, documentedEquity.exchange)
    },
    async stop() {
      stopped = true
      preventReconnect = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = null
      closeSocket(true)
      subscriptions.clear()
    },
    getStatus() {
      return {
        provider: 'infoway',
        mode,
        connection: state === 'live' ? 'connected' : 'disconnected',
        configured: true,
        message: detail,
        checkedAt: new Date().toISOString(),
      }
    },
    async subscribe(symbol, exchange) {
      if (stopped) return
      const request = toRequest(symbol, exchange)
      if (!request || subscriptions.has(request.code)) return
      if (business && business !== request.business) {
        throw new Error('Infoway free plan allows one WebSocket connection.')
      }
      if (subscriptions.size >= maxWebsocketSubscriptions) {
        throw new Error('Infoway free plan allows 10 WebSocket subscriptions.')
      }
      subscriptions.add(request.code)
      business = request.business
      try {
        ensureSocket(request.business)
      } catch (error: unknown) {
        subscriptions.delete(request.code)
        if (subscriptions.size === 0) business = null
        const message = error instanceof Error ? redact(error.message, apiKey) : ''
        throw new Error(message || 'Infoway websocket failed to open.')
      }
      if (ready) sendRaw({ code: 10000, trace: traceId(), data: { codes: request.code } })
    },
    async unsubscribe(symbol, exchange) {
      const request = toRequest(symbol, exchange)
      if (!request || !subscriptions.delete(request.code)) return
      if (ready) sendRaw({ code: 11000, trace: traceId(), data: { codes: request.code } })
      if (subscriptions.size === 0) {
        closeSocket(true)
        business = null
      }
    },
    getQuote,
    async listQuotes(query) {
      if (query.exchange && !isInfowayExchange(query.exchange)) return []
      if (query.q && query.exchange && isInfowayExchange(query.exchange)) {
        const tick = await getQuote(query.q, query.exchange)
        return tick ? [tick] : []
      }
      const symbolQuery = query.q?.trim()
      if (symbolQuery && !query.exchange) {
        const tick = await getQuote(symbolQuery, 'US')
        if (tick) return [tick]
      }
      if (state !== 'live') return []
      if (!symbolQuery && !query.exchange) {
        await getQuote(documentedEquity.symbol, documentedEquity.exchange)
      }
      const q = query.q?.trim().toUpperCase()
      const now = Date.now()
      return [...quotes.values()]
        .filter((item) => now - item.at <= quoteCacheMs)
        .map((item) => item.tick)
        .filter((tick) => {
          if (query.exchange && tick.exchange !== query.exchange) return false
          if (q && !tick.symbol.includes(q)) return false
          return true
        })
    },
    async getIndices() {
      if (state !== 'live') return []
      return [...quotes.values()].map((item) => item.tick).filter((tick) => tick.kind === 'index')
    },
    async getHistory() {
      return []
    },
    onTick(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    fetchQuoteCandidates,
  }
}
