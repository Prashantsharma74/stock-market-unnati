import type { Server as HttpServer } from 'http'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'
import { createMarketDataProvider } from './createProvider'
import type { MarketDataProvider } from './market.provider'
import type { CandleInterval, MarketExchange, MarketStatus, NormalizedCandle, NormalizedTick } from './market.types'
import { attachMarketSocket, closeMarketSocket } from './market.socket'
import {
  connectQuoteCache,
  createMemoryQuoteCache,
  feedServesQuotes,
  isPublishableCandle,
  isPublishableTick,
  memoryQuoteCacheLabel,
  type QuoteCache,
} from './redisQuotes'
import { resolveExploreCandidates } from './exploreAllowlist'
import { getIndiaSymbolCatalog, searchIndiaCatalog } from './infowaySymbolCatalog'
import { createSubscriptionRegistry } from './subscriptionRegistry'

export type StockList = {
  dataSource: 'unconfigured' | 'mock' | 'provider'
  items: NormalizedTick[]
}

export type ExploreStockList = {
  dataSource: 'unconfigured' | 'mock' | 'provider'
  india: NormalizedTick[]
  us: NormalizedTick[]
  feedMessage?: string
  exploreMode?: 'default' | 'env' | 'file'
}

export type IndexList = {
  items: NormalizedTick[]
}

export type HistoryList = {
  candles: NormalizedCandle[]
}

export function createMarketRuntime(options?: { provider?: MarketDataProvider; cache?: QuoteCache }) {
  const provider = options?.provider ?? createMarketDataProvider()
  let cache = options?.cache ?? createMemoryQuoteCache(memoryQuoteCacheLabel)
  const registry = createSubscriptionRegistry(provider)
  const listeners = new Set<(tick: NormalizedTick) => void>()
  const statusListeners = new Set<(status: MarketStatus) => void>()
  const pendingTicks = new Set<Promise<void>>()
  let stopProviderTicks = () => {}
  let started = false
  let statusOverride: MarketStatus | undefined

  function getHealth() {
    return statusOverride ?? provider.getStatus()
  }

  function publishStatus(status: MarketStatus) {
    for (const listener of [...statusListeners]) {
      try {
        listener(status)
      } catch (error: unknown) {
        logger.error('Market status listener failed', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }

  function emitTick(tick: NormalizedTick) {
    for (const listener of [...listeners]) {
      try {
        listener(tick)
      } catch (error: unknown) {
        logger.error('Market tick listener failed', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }

  async function remember(tick: NormalizedTick) {
    const status = getHealth()
    await cache.putStatus(status)
    if (!isPublishableTick(tick, status)) return
    const stored = await cache.putQuote(tick)
    if (!stored) {
      logger.warn('Market tick was not cached', {
        symbol: tick.symbol,
        exchange: tick.exchange,
        source: tick.source,
      })
    }
    if (!isPublishableTick(tick, getHealth())) return
    emitTick(tick)
  }

  function trackTick(tick: NormalizedTick) {
    const task = remember(tick)
    pendingTicks.add(task)
    void task.finally(() => {
      pendingTicks.delete(task)
    })
  }

  async function start() {
    if (started) return
    started = true
    stopProviderTicks = provider.onTick((tick) => {
      trackTick(tick)
    })

    try {
      await cache.putStatus(provider.getStatus())
      await provider.start()
      await Promise.all([...pendingTicks])
      statusOverride = undefined
      const status = provider.getStatus()
      await cache.putStatus(status)
      publishStatus(status)
    } catch (error: unknown) {
      logger.error('Market feed failed to start', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      const current = provider.getStatus()
      statusOverride = {
        ...current,
        connection: current.connection === 'unconfigured' ? 'unconfigured' : 'disconnected',
        configured: false,
        message: 'Market feed failed to start.',
        checkedAt: new Date().toISOString(),
      }
      await cache.putStatus(statusOverride)
      publishStatus(statusOverride)
    }
  }

  async function stop() {
    stopProviderTicks()
    stopProviderTicks = () => {}
    if (!started) return
    started = false
    try {
      await provider.stop()
    } catch (error: unknown) {
      logger.error('Market feed failed to stop', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
    await Promise.all([...pendingTicks])
  }

  async function listStocks(query: { q?: string; exchange?: MarketExchange }): Promise<StockList> {
    const initial = getHealth()
    if (!feedServesQuotes(initial) && !(initial.provider === 'infoway' && initial.configured)) {
      await cache.putStatus(initial)
      return { dataSource: 'unconfigured', items: [] }
    }

    const listed = await provider.listQuotes(query)
    const status = await commitProviderStatus(initial)
    if (!feedServesQuotes(status)) return { dataSource: 'unconfigured', items: [] }
    const items = listed.filter((tick) => isPublishableTick(tick, status))
    await Promise.all(items.map((tick) => cache.putQuote(tick)))
    return {
      dataSource: status.connection === 'mock' ? 'mock' : 'provider',
      items,
    }
  }

  async function getStock(symbol: string, exchange: MarketExchange): Promise<NormalizedTick | null> {
    const initial = getHealth()
    if (!feedServesQuotes(initial) && !(initial.provider === 'infoway' && initial.configured)) {
      await cache.putStatus(initial)
      return null
    }

    if (feedServesQuotes(initial)) {
      const cached = await cache.getQuote(symbol, exchange)
      if (cached && isPublishableTick(cached, initial)) return cached
    }

    const fresh = await provider.getQuote(symbol, exchange)
    const status = await commitProviderStatus(initial)
    if (!fresh || !isPublishableTick(fresh, status)) return null
    await cache.putQuote(fresh)
    return fresh
  }

  async function listIndices(): Promise<IndexList> {
    const status = getHealth()
    if (!feedServesQuotes(status)) {
      await cache.putStatus(status)
      return { items: [] }
    }

    await cache.putStatus(status)
    const items = (await provider.getIndices()).filter((tick) => isPublishableTick(tick, status))
    await Promise.all(items.map((tick) => cache.putQuote(tick)))
    return { items }
  }

  async function listExploreStocks(): Promise<ExploreStockList> {
    const initial = getHealth()
    if (initial.provider !== 'infoway') {
      await cache.putStatus(initial)
      return { dataSource: 'unconfigured', india: [], us: [] }
    }

    type InfowayBatch = MarketDataProvider & {
      fetchQuoteCandidates?: (candidates: { symbol: string; exchange: MarketExchange }[]) => Promise<NormalizedTick[]>
    }
    const batchProvider = provider as InfowayBatch
    const { mode: exploreMode, candidates } = resolveExploreCandidates()
    const raw =
      typeof batchProvider.fetchQuoteCandidates === 'function'
        ? await batchProvider.fetchQuoteCandidates(candidates)
        : []

    const status = getHealth()
    const india: NormalizedTick[] = []
    const us: NormalizedTick[] = []
    for (const tick of raw) {
      if (!isPublishableTick(tick, status)) continue
      await cache.putQuote(tick)
      if (tick.exchange === 'IN') india.push(tick)
      else if (tick.exchange === 'US') us.push(tick)
    }

    const health = getHealth()
    await cache.putStatus(health)
    if (india.length === 0 && us.length === 0) {
      return {
        dataSource: 'unconfigured',
        india: [],
        us: [],
        feedMessage: health.message,
      }
    }
    const shown = india.length + us.length
    const permittedHint =
      exploreMode === 'default' && shown < candidates.length
        ? `Showing ${shown} of ${candidates.length} explore names. Infoway only returns symbols on your plan (514). Run npm run probe:infoway-explore to build an allowlist.`
        : exploreMode !== 'default'
          ? `Explore allowlist (${exploreMode}): ${shown} live quote(s) from ${candidates.length} configured symbol(s).`
          : undefined
    return {
      dataSource: 'provider',
      india,
      us,
      exploreMode,
      ...(permittedHint ? { feedMessage: permittedHint } : {}),
    }
  }

  async function listIndiaSymbolCatalog(query: { q?: string; offset: number; limit: number; includeIndices?: boolean }) {
    const status = getHealth()
    if (status.provider !== 'infoway') {
      return {
        provider: 'none' as const,
        total: 0,
        items: [] as { code: string; localSymbol: string; name: string; isIndex: boolean }[],
        message: 'India symbol catalog requires MARKET_DATA_PROVIDER=infoway and a valid Infoway key.',
      }
    }
    const catalog = await getIndiaSymbolCatalog()
    if (!catalog.ok) {
      const failMessage =
        catalog.reason === 'missing_key'
          ? 'Infoway API key is not configured.'
          : 'message' in catalog && catalog.message
            ? catalog.message
            : 'Catalog fetch failed.'
      return {
        provider: 'infoway' as const,
        total: 0,
        items: [],
        message: failMessage,
      }
    }
    const page = searchIndiaCatalog(catalog.rows, {
      q: query.q,
      offset: query.offset,
      limit: query.limit,
      stocksOnly: !query.includeIndices,
    })
    return {
      provider: 'infoway' as const,
      cachedAt: catalog.cachedAt,
      stale: 'stale' in catalog && catalog.stale === true,
      total: page.total,
      items: page.items,
      message: 'Symbols from Infoway STOCK_IN. Quotes use exchange IN (NSE-style code.IN). Live prices are per-symbol, not for the full list at once.',
    }
  }

  async function getHistory(symbol: string, exchange: MarketExchange, interval: CandleInterval): Promise<HistoryList> {
    const status = getHealth()
    if (!feedServesQuotes(status)) return { candles: [] }
    const candles = (await provider.getHistory(symbol, exchange, interval)).filter((candle) =>
      isPublishableCandle(candle, status),
    )
    return { candles }
  }

  async function subscribe(symbol: string, exchange: MarketExchange) {
    const count = await registry.subscribe(symbol, exchange)
    await cache.setSubscriberCount(symbol, exchange, count)
    return count
  }

  async function unsubscribe(symbol: string, exchange: MarketExchange) {
    const count = await registry.unsubscribe(symbol, exchange)
    await cache.setSubscriberCount(symbol, exchange, count)
    return count
  }

  async function commitProviderStatus(previous: MarketStatus) {
    const status = getHealth()
    await cache.putStatus(status)
    if (
      previous.connection !== status.connection ||
      previous.configured !== status.configured ||
      previous.provider !== status.provider ||
      previous.message !== status.message
    ) {
      publishStatus(status)
    }
    return status
  }

  function onTick(listener: (tick: NormalizedTick) => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function onStatus(listener: (status: MarketStatus) => void) {
    statusListeners.add(listener)
    return () => {
      statusListeners.delete(listener)
    }
  }

  async function replaceCache(next: QuoteCache) {
    const previous = cache
    cache = next
    await cache.putStatus(getHealth())
    await Promise.all(registry.entries().map((entry) => cache.setSubscriberCount(entry.symbol, entry.exchange, entry.count)))
    if (previous !== next) await previous.close()
  }

  async function closeCache() {
    await cache.close()
  }

  return {
    getHealth,
    listStocks,
    listExploreStocks,
    listIndiaSymbolCatalog,
    getStock,
    listIndices,
    getHistory,
    subscribe,
    unsubscribe,
    onTick,
    onStatus,
    start,
    stop,
    replaceCache,
    closeCache,
    registry,
  }
}

export type MarketRuntime = ReturnType<typeof createMarketRuntime>

let runtime: MarketRuntime | undefined
let booted = false

export function getMarketRuntime() {
  if (!runtime) runtime = createMarketRuntime()
  return runtime
}

export function attachMarketDataSocket(server: HttpServer) {
  return attachMarketSocket(server, getMarketRuntime())
}

export function bootMarketFeed(): Promise<void> {
  if (booted) return Promise.resolve()
  booted = true

  return (async () => {
    const current = getMarketRuntime()
    try {
      if (env.REDIS_URL) {
        const cache = await connectQuoteCache(env.REDIS_URL)
        await current.replaceCache(cache)
      } else {
        logger.info(memoryQuoteCacheLabel)
      }
    } catch (error: unknown) {
      logger.warn('Quote cache stayed in memory', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    try {
      await current.start()
    } catch (error: unknown) {
      logger.error('Market feed failed to start', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })()
}

export async function stopMarketData() {
  if (runtime) {
    try {
      await runtime.stop()
    } catch (error: unknown) {
      logger.error('Market feed failed to stop', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  try {
    await closeMarketSocket()
  } catch (error: unknown) {
    logger.error('Market socket failed to close', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  if (runtime) {
    try {
      await runtime.closeCache()
    } catch (error: unknown) {
      logger.error('Quote cache failed to close', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
