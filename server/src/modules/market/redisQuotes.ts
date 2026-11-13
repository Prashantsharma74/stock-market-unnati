import Redis from 'ioredis'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'
import { isInfowayExchange, isMarketExchange, type MarketExchange, type MarketStatus, type NormalizedCandle, type NormalizedTick } from './market.types'
import { canonicalSampleSymbol, sampleDataLabel } from './sampleSymbols'

export const memoryQuoteCacheLabel = 'In-memory quote cache. Redis is not configured.'
export const redisUnavailableQuoteCacheLabel = 'In-memory quote cache. Redis is unavailable.'

export const marketStatusKey = 'mkt:status'
const quoteTtlSeconds = 15

export type QuoteCacheBackend = 'memory' | 'redis'

export type QuoteCache = {
  readonly backend: QuoteCacheBackend
  readonly label?: string
  putStatus(status: MarketStatus): Promise<void>
  getStatus(): Promise<MarketStatus | null>
  putQuote(tick: NormalizedTick): Promise<boolean>
  getQuote(symbol: string, exchange: MarketExchange): Promise<NormalizedTick | null>
  listQuotes(exchange?: MarketExchange): Promise<NormalizedTick[]>
  listIndices(exchange?: MarketExchange): Promise<NormalizedTick[]>
  setSubscriberCount(symbol: string, exchange: MarketExchange, count: number): Promise<void>
  getSubscriberCount(symbol: string, exchange: MarketExchange): Promise<number>
  keys(): Promise<string[]>
  close(): Promise<void>
}

type QuoteStore = {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds?: number): Promise<void>
  del(keys: string[]): Promise<void>
  list(prefix: string): Promise<string[]>
  close(): Promise<void>
}

type StoredQuote = NormalizedTick & { cachedAt: string }

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase()
}

export function marketQuoteKey(exchange: MarketExchange, symbol: string) {
  return `mkt:quote:${exchange}:${normalizeSymbol(symbol)}`
}

export function marketIndexKey(exchange: MarketExchange, symbol: string) {
  return `mkt:index:${exchange}:${normalizeSymbol(symbol)}`
}

export function marketSubscriberKey(exchange: MarketExchange, symbol: string) {
  return `mkt:subs:${exchange}:${normalizeSymbol(symbol)}`
}

export function feedServesQuotes(status: MarketStatus | null | undefined) {
  return status?.connection === 'mock' || status?.connection === 'connected'
}

function finitePrice(value: number) {
  return Number.isFinite(value)
}

export function isPublishableTick(tick: NormalizedTick, status: MarketStatus | null | undefined) {
  if (!feedServesQuotes(status)) return false
  if (!finitePrice(tick.ltp) || !finitePrice(tick.previousClose) || !finitePrice(tick.change) || !finitePrice(tick.changePct)) {
    return false
  }

  if (tick.source === 'mock') {
    return (
      status?.connection === 'mock' &&
      tick.exchange === 'SAMPLE' &&
      tick.label === sampleDataLabel &&
      canonicalSampleSymbol(tick.symbol) === tick.symbol
    )
  }

  if (tick.source === 'provider') {
    if (tick.label === sampleDataLabel) return false
    if (status?.connection !== 'connected') return false
    if (status.provider === 'truedata') return tick.exchange === 'NSE' || tick.exchange === 'BSE'
    if (status.provider === 'infoway') return isInfowayExchange(tick.exchange)
    return false
  }

  return false
}

export function isPublishableCandle(candle: NormalizedCandle, status: MarketStatus | null | undefined) {
  if (!feedServesQuotes(status)) return false
  if (!finitePrice(candle.open) || !finitePrice(candle.high) || !finitePrice(candle.low) || !finitePrice(candle.close)) {
    return false
  }

  if (candle.source === 'mock') {
    return (
      status?.connection === 'mock' &&
      candle.exchange === 'SAMPLE' &&
      candle.label === sampleDataLabel &&
      canonicalSampleSymbol(candle.symbol) === candle.symbol
    )
  }

  if (candle.source === 'provider') {
    if (candle.label === sampleDataLabel) return false
    if (status?.connection !== 'connected') return false
    if (status.provider === 'truedata') return candle.exchange === 'NSE' || candle.exchange === 'BSE'
    if (status.provider === 'infoway') return isInfowayExchange(candle.exchange)
    return false
  }

  return false
}

function isMarketStatus(value: unknown): value is MarketStatus {
  if (!value || typeof value !== 'object') return false
  const status = value as Partial<MarketStatus>
  return (
    (status.provider === 'none' || status.provider === 'mock' || status.provider === 'truedata' || status.provider === 'infoway') &&
    (status.mode === 'sandbox' || status.mode === 'production') &&
    (status.connection === 'unconfigured' ||
      status.connection === 'mock' ||
      status.connection === 'connecting' ||
      status.connection === 'connected' ||
      status.connection === 'disconnected') &&
    typeof status.configured === 'boolean' &&
    typeof status.message === 'string' &&
    typeof status.checkedAt === 'string'
  )
}

function isStoredQuote(value: unknown): value is StoredQuote {
  if (!value || typeof value !== 'object') return false
  const tick = value as Partial<StoredQuote>
  return (
    typeof tick.symbol === 'string' &&
    typeof tick.exchange === 'string' &&
    isMarketExchange(tick.exchange) &&
    (tick.kind === 'stock' || tick.kind === 'index') &&
    typeof tick.ltp === 'number' &&
    typeof tick.previousClose === 'number' &&
    typeof tick.change === 'number' &&
    typeof tick.changePct === 'number' &&
    typeof tick.ts === 'string' &&
    (tick.source === 'unconfigured' || tick.source === 'mock' || tick.source === 'provider') &&
    typeof tick.cachedAt === 'string'
  )
}

function toTick(stored: StoredQuote): NormalizedTick {
  return {
    symbol: stored.symbol,
    exchange: stored.exchange,
    kind: stored.kind,
    ltp: stored.ltp,
    previousClose: stored.previousClose,
    change: stored.change,
    changePct: stored.changePct,
    ...(stored.volume !== undefined ? { volume: stored.volume } : {}),
    ...(stored.bid !== undefined ? { bid: stored.bid } : {}),
    ...(stored.ask !== undefined ? { ask: stored.ask } : {}),
    ts: stored.ts,
    source: stored.source,
    ...(stored.label ? { label: stored.label } : {}),
  }
}

function quoteStorageKey(tick: NormalizedTick) {
  return tick.kind === 'index' ? marketIndexKey(tick.exchange, tick.symbol) : marketQuoteKey(tick.exchange, tick.symbol)
}

function createMemoryStore(): QuoteStore {
  const records = new Map<string, { value: string; expiresAt?: number }>()

  function live(key: string) {
    const record = records.get(key)
    if (!record) return undefined
    if (record.expiresAt !== undefined && record.expiresAt <= Date.now()) {
      records.delete(key)
      return undefined
    }
    return record
  }

  return {
    async get(key) {
      return live(key)?.value ?? null
    },
    async set(key, value, ttlSeconds) {
      records.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      })
    },
    async del(keys) {
      for (const key of keys) records.delete(key)
    },
    async list(prefix) {
      const keys: string[] = []
      for (const key of records.keys()) {
        if (!live(key)) continue
        if (key.startsWith(prefix)) keys.push(key)
      }
      return keys
    },
    async close() {
      records.clear()
    },
  }
}

function createRedisStore(redis: Redis): QuoteStore {
  async function scan(match: string) {
    const keys: string[] = []
    let cursor = '0'
    do {
      const [next, batch] = await redis.scan(cursor, 'MATCH', match, 'COUNT', 100)
      cursor = next
      keys.push(...batch)
    } while (cursor !== '0')
    return keys
  }

  return {
    async get(key) {
      return redis.get(key)
    },
    async set(key, value, ttlSeconds) {
      if (ttlSeconds) await redis.set(key, value, 'EX', ttlSeconds)
      else await redis.set(key, value)
    },
    async del(keys) {
      for (let index = 0; index < keys.length; index += 100) {
        const chunk = keys.slice(index, index + 100)
        if (chunk.length) await redis.del(...chunk)
      }
    },
    async list(prefix) {
      return scan(`${prefix}*`)
    },
    async close() {
      try {
        await redis.quit()
      } catch {
        redis.disconnect()
      }
    },
  }
}

function createQuoteCache(store: QuoteStore, backend: QuoteCacheBackend, label?: string): QuoteCache {
  async function readStatus() {
    try {
      const raw = await store.get(marketStatusKey)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      if (!isMarketStatus(parsed)) return null
      return parsed
    } catch (error: unknown) {
      logger.warn('Quote cache status could not be read', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      return null
    }
  }

  async function readTick(key: string) {
    try {
      const raw = await store.get(key)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      if (!isStoredQuote(parsed)) {
        await store.del([key])
        return null
      }
      const tick = toTick(parsed)
      const status = await readStatus()
      if (!isPublishableTick(tick, status)) {
        await store.del([key])
        return null
      }
      return tick
    } catch (error: unknown) {
      logger.warn('Quote cache tick could not be read', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      return null
    }
  }

  async function ticksWithPrefix(prefix: string, exchange?: MarketExchange) {
    const status = await readStatus()
    if (!feedServesQuotes(status)) return []
    let keys: string[] = []
    try {
      keys = await store.list(prefix)
    } catch (error: unknown) {
      logger.warn('Quote cache keys could not be listed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      return []
    }

    const ticks: NormalizedTick[] = []
    for (const key of keys) {
      const tick = await readTick(key)
      if (!tick) continue
      if (exchange && tick.exchange !== exchange) continue
      ticks.push(tick)
    }
    return ticks
  }

  return {
    backend,
    ...(label ? { label } : {}),
    async putStatus(status) {
      try {
        await store.set(marketStatusKey, JSON.stringify(status))
        if (!feedServesQuotes(status)) {
          const quoteKeys = await store.list('mkt:quote:')
          const indexKeys = await store.list('mkt:index:')
          await store.del([...quoteKeys, ...indexKeys])
        }
      } catch (error: unknown) {
        logger.warn('Quote cache status could not be saved', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
    getStatus: readStatus,
    async putQuote(tick) {
      try {
        const status = await readStatus()
        if (!isPublishableTick(tick, status)) return false
        const stored: StoredQuote = { ...tick, cachedAt: new Date().toISOString() }
        await store.set(quoteStorageKey(tick), JSON.stringify(stored), quoteTtlSeconds)
        return true
      } catch (error: unknown) {
        logger.warn('Quote cache tick could not be saved', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
        return false
      }
    },
    async getQuote(symbol, exchange) {
      const stock = await readTick(marketQuoteKey(exchange, symbol))
      if (stock) return stock
      return readTick(marketIndexKey(exchange, symbol))
    },
    listQuotes(exchange) {
      return ticksWithPrefix('mkt:quote:', exchange)
    },
    listIndices(exchange) {
      return ticksWithPrefix('mkt:index:', exchange)
    },
    async setSubscriberCount(symbol, exchange, count) {
      const key = marketSubscriberKey(exchange, symbol)
      try {
        if (count <= 0) {
          await store.del([key])
          return
        }
        await store.set(key, String(count))
      } catch (error: unknown) {
        logger.warn('Quote cache subscriber count could not be saved', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
    async getSubscriberCount(symbol, exchange) {
      try {
        const raw = await store.get(marketSubscriberKey(exchange, symbol))
        if (!raw) return 0
        const count = Number(raw)
        return Number.isInteger(count) && count > 0 ? count : 0
      } catch (error: unknown) {
        logger.warn('Quote cache subscriber count could not be read', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
        return 0
      }
    },
    async keys() {
      try {
        const [quotes, indexes, subs, status] = await Promise.all([
          store.list('mkt:quote:'),
          store.list('mkt:index:'),
          store.list('mkt:subs:'),
          store.list(marketStatusKey),
        ])
        return [...quotes, ...indexes, ...subs, ...status]
      } catch (error: unknown) {
        logger.warn('Quote cache keys could not be listed', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
        return []
      }
    },
    close() {
      return store.close()
    },
  }
}

export function createMemoryQuoteCache(label = memoryQuoteCacheLabel) {
  return createQuoteCache(createMemoryStore(), 'memory', label)
}

export async function connectQuoteCache(redisUrl = env.REDIS_URL): Promise<QuoteCache> {
  if (!redisUrl) {
    logger.info(memoryQuoteCacheLabel)
    return createMemoryQuoteCache(memoryQuoteCacheLabel)
  }

  let redis: Redis | undefined
  try {
    redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    })
    redis.on('error', (error: Error) => {
      logger.warn('Redis quote cache error', { message: error.message })
    })
    await redis.connect()
    await redis.ping()
    logger.info('Quote cache using Redis')
    return createQuoteCache(createRedisStore(redis), 'redis')
  } catch (error: unknown) {
    logger.warn(redisUnavailableQuoteCacheLabel, {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    if (redis) redis.disconnect()
    return createMemoryQuoteCache(redisUnavailableQuoteCacheLabel)
  }
}
