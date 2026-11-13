import type { Server as HttpServer } from 'http'
import { Server, type Socket } from 'socket.io'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'
import { verifyAccessToken, type AccessClaims } from '../../utils/tokens'
import type { MarketExchange, MarketStatus, NormalizedTick } from './market.types'
import { subscriptionPayloadSchema } from './market.validators'

export type MarketSocketRuntime = {
  getHealth(): MarketStatus
  subscribe(symbol: string, exchange: MarketExchange): Promise<number>
  unsubscribe(symbol: string, exchange: MarketExchange): Promise<number>
  getStock(symbol: string, exchange: MarketExchange): Promise<NormalizedTick | null>
  onTick(listener: (tick: NormalizedTick) => void): () => void
  onStatus(listener: (status: MarketStatus) => void): () => void
}

let io: Server | undefined
let stopTicks: (() => void) | undefined
let stopStatus: (() => void) | undefined

export function accessTokenFromCookieHeader(header: string | string[] | undefined) {
  const raw = Array.isArray(header) ? header.join(';') : header
  if (!raw) return undefined

  for (const part of raw.split(';')) {
    const separator = part.indexOf('=')
    if (separator === -1) continue
    const key = part.slice(0, separator).trim()
    if (key !== 'finora_access') continue
    try {
      return decodeURIComponent(part.slice(separator + 1).trim())
    } catch {
      return undefined
    }
  }

  return undefined
}

export function authenticateSocketCookie(header: string | string[] | undefined): AccessClaims | undefined {
  const token = accessTokenFromCookieHeader(header)
  if (!token) return undefined
  try {
    return verifyAccessToken(token)
  } catch {
    return undefined
  }
}

function roomFor(exchange: MarketExchange, symbol: string) {
  return `mkt:${exchange}:${symbol}`
}

function subscriptionId(exchange: MarketExchange, symbol: string) {
  return `${exchange}:${symbol}`
}

async function handleSubscribe(socket: Socket, runtime: MarketSocketRuntime, joined: Set<string>, payload: unknown) {
  const parsed = subscriptionPayloadSchema.safeParse(payload)
  if (!parsed.success) {
    logger.warn('Rejected market subscription', { reason: 'invalid_payload' })
    return
  }

  const { symbol, exchange } = parsed.data
  const id = subscriptionId(exchange, symbol)
  if (joined.has(id)) return

  joined.add(id)
  socket.join(roomFor(exchange, symbol))

  try {
    await runtime.subscribe(symbol, exchange)
    const quote = await runtime.getStock(symbol, exchange)
    if (!quote) return
    const event = quote.kind === 'index' ? 'market:index' : 'stock:price'
    socket.emit(event, quote)
  } catch (error: unknown) {
    joined.delete(id)
    socket.leave(roomFor(exchange, symbol))
    logger.error('Market subscription failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

async function handleUnsubscribe(socket: Socket, runtime: MarketSocketRuntime, joined: Set<string>, payload: unknown) {
  const parsed = subscriptionPayloadSchema.safeParse(payload)
  if (!parsed.success) {
    logger.warn('Rejected market subscription', { reason: 'invalid_payload' })
    return
  }

  const { symbol, exchange } = parsed.data
  const id = subscriptionId(exchange, symbol)
  if (!joined.has(id)) return

  joined.delete(id)
  socket.leave(roomFor(exchange, symbol))

  try {
    await runtime.unsubscribe(symbol, exchange)
  } catch (error: unknown) {
    logger.error('Market unsubscribe failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

async function releaseAll(socket: Socket, runtime: MarketSocketRuntime, joined: Set<string>) {
  for (const id of [...joined]) {
    const splitAt = id.indexOf(':')
    const exchange = id.slice(0, splitAt) as MarketExchange
    const symbol = id.slice(splitAt + 1)
    socket.leave(roomFor(exchange, symbol))
    try {
      await runtime.unsubscribe(symbol, exchange)
    } catch (error: unknown) {
      logger.error('Market unsubscribe failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  joined.clear()
}

export function attachMarketSocket(server: HttpServer, runtime: MarketSocketRuntime) {
  if (io) return io

  io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const claims = authenticateSocketCookie(socket.handshake.headers.cookie)
    if (!claims) {
      next(new Error('UNAUTHENTICATED'))
      return
    }
    socket.data.userId = claims.sub
    next()
  })

  stopTicks = runtime.onTick((tick) => {
    const event = tick.kind === 'index' ? 'market:index' : 'stock:price'
    io?.to(roomFor(tick.exchange, tick.symbol)).emit(event, tick)
  })

  stopStatus = runtime.onStatus((status) => {
    io?.emit('market:status', status)
  })

  io.on('connection', (socket) => {
    socket.emit('market:status', runtime.getHealth())
    const joined = new Set<string>()

    socket.on('subscribe:stock', (payload: unknown) => {
      void handleSubscribe(socket, runtime, joined, payload)
    })

    socket.on('unsubscribe:stock', (payload: unknown) => {
      void handleUnsubscribe(socket, runtime, joined, payload)
    })

    socket.on('disconnect', () => {
      void releaseAll(socket, runtime, joined)
    })
  })

  return io
}

export async function closeMarketSocket() {
  stopTicks?.()
  stopTicks = undefined
  stopStatus?.()
  stopStatus = undefined
  if (!io) return
  const current = io
  io = undefined
  await current.close()
}
