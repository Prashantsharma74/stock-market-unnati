import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getMarketHealth, isAbortError, listMarketIndices, listMarketStocks, messageFrom } from './api.ts'
import {
  feedServesQuotes,
  isMarketStatus,
  parseIndexList,
  parseStockList,
  presentListedTick,
  presentTick,
  subscriptionKey,
  uniqueSubscriptions,
} from './parse.ts'
import { createMarketSocket, emitStockSubscription, type MarketClientSocket } from './socket.ts'
import type { ExchangeFilter, MarketStatus, MarketSubscription, NormalizedTick } from './types.ts'

export type SocketLink = 'connected' | 'disconnected'

function replaceTick(list: NormalizedTick[], tick: NormalizedTick) {
  let changed = false
  const next = list.map((item) => {
    if (item.symbol !== tick.symbol || item.exchange !== tick.exchange) return item
    changed = true
    return tick
  })
  return changed ? next : list
}

function sameSubscriptions(left: MarketSubscription[], right: MarketSubscription[]) {
  if (left.length !== right.length) return false
  const keys = new Set(left.map((item) => subscriptionKey(item.symbol, item.exchange)))
  return right.every((item) => keys.has(subscriptionKey(item.symbol, item.exchange)))
}

export function useMarketBoard(query: string, exchange: ExchangeFilter) {
  const [feed, setFeed] = useState<MarketStatus | null>(null)
  const [feedError, setFeedError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [indexError, setIndexError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stocks, setStocks] = useState<NormalizedTick[]>([])
  const [indexBook, setIndexBook] = useState<NormalizedTick[]>([])
  const [socketStatus, setSocketStatus] = useState<SocketLink>('disconnected')
  const [reloadKey, setReloadKey] = useState(0)

  const feedRef = useRef<MarketStatus | null>(null)
  const socketRef = useRef<MarketClientSocket | null>(null)
  const desiredRef = useRef<MarketSubscription[]>([])
  const allowedRef = useRef<Set<string>>(new Set())
  const applyTickRef = useRef<(payload: unknown) => void>(() => {})
  const commitStatusRef = useRef<(status: MarketStatus, refreshLists: boolean) => void>(() => {})

  const commitStatus = useCallback((status: MarketStatus, refreshLists: boolean) => {
    const current = feedRef.current
    if (current) {
      const nextTime = Date.parse(status.checkedAt)
      const currentTime = Date.parse(current.checkedAt)
      if (Number.isFinite(nextTime) && Number.isFinite(currentTime) && nextTime < currentTime) return
    }
    const servingChanged = current ? feedServesQuotes(current) !== feedServesQuotes(status) : false
    feedRef.current = status
    setFeed(status)
    setFeedError(null)
    if (!feedServesQuotes(status)) {
      setStocks([])
      setIndexBook([])
    }
    if (servingChanged && refreshLists) setReloadKey((value) => value + 1)
  }, [])

  commitStatusRef.current = commitStatus

  const visibleIndices = useMemo(
    () => indexBook.filter((tick) => exchange === 'ALL' || tick.exchange === exchange),
    [indexBook, exchange],
  )

  const subscriptions = useMemo(() => {
    if (feed && !feedServesQuotes(feed)) return []
    return uniqueSubscriptions([...visibleIndices, ...stocks])
  }, [feed, visibleIndices, stocks])

  const subscriptionSignature = subscriptions
    .map((item) => subscriptionKey(item.symbol, item.exchange))
    .sort()
    .join('|')

  allowedRef.current = new Set(subscriptions.map((item) => subscriptionKey(item.symbol, item.exchange)))

  applyTickRef.current = (payload: unknown) => {
    const tick = presentTick(payload, feedRef.current)
    if (!tick) return
    if (!allowedRef.current.has(subscriptionKey(tick.symbol, tick.exchange))) return
    setStocks((current) => replaceTick(current, tick))
    setIndexBook((current) => replaceTick(current, tick))
  }

  useEffect(() => {
    const socket = createMarketSocket()
    socketRef.current = socket
    let alive = true

    const onConnect = () => {
      if (!alive) return
      setSocketStatus('connected')
      for (const item of desiredRef.current) {
        emitStockSubscription(socket, 'subscribe:stock', item.symbol, item.exchange)
      }
    }
    const onDisconnect = () => {
      if (!alive) return
      setSocketStatus('disconnected')
    }
    const onStatus = (payload: unknown) => {
      if (!alive || !isMarketStatus(payload)) return
      commitStatusRef.current(payload, true)
    }
    const onTick = (payload: unknown) => {
      if (!alive) return
      applyTickRef.current(payload)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onDisconnect)
    socket.on('market:status', onStatus)
    socket.on('stock:price', onTick)
    socket.on('market:index', onTick)

    return () => {
      alive = false
      if (socket.connected) {
        for (const item of desiredRef.current) {
          emitStockSubscription(socket, 'unsubscribe:stock', item.symbol, item.exchange)
        }
      }
      desiredRef.current = []
      socket.removeAllListeners()
      socket.disconnect()
      if (socketRef.current === socket) socketRef.current = null
    }
  }, [])

  useEffect(() => {
    const next = subscriptions
    const previous = desiredRef.current
    if (!sameSubscriptions(previous, next)) {
      const socket = socketRef.current
      if (socket?.connected) {
        const nextKeys = new Set(next.map((item) => subscriptionKey(item.symbol, item.exchange)))
        const previousKeys = new Set(previous.map((item) => subscriptionKey(item.symbol, item.exchange)))
        for (const item of previous) {
          if (!nextKeys.has(subscriptionKey(item.symbol, item.exchange))) {
            emitStockSubscription(socket, 'unsubscribe:stock', item.symbol, item.exchange)
          }
        }
        for (const item of next) {
          if (!previousKeys.has(subscriptionKey(item.symbol, item.exchange))) {
            emitStockSubscription(socket, 'subscribe:stock', item.symbol, item.exchange)
          }
        }
      }
    }
    desiredRef.current = next
  }, [subscriptionSignature, subscriptions])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setListError(null)
    setIndexError(null)
    setStocks([])

    void (async () => {
      try {
        const exchangeParam = exchange === 'ALL' ? undefined : exchange
        const [healthResult, stockResult, indexResult] = await Promise.allSettled([
          getMarketHealth(controller.signal),
          listMarketStocks({ q: query, exchange: exchangeParam }, controller.signal),
          listMarketIndices(controller.signal),
        ])
        if (!active) return

        if (healthResult.status === 'fulfilled') {
          if (isMarketStatus(healthResult.value)) commitStatus(healthResult.value, false)
          else setFeedError('The market service returned an unreadable status.')
        } else if (!isAbortError(healthResult.reason)) {
          setFeedError(messageFrom(healthResult.reason))
        }

        const latest = feedRef.current
        const down = latest !== null && !feedServesQuotes(latest)

        if (stockResult.status === 'fulfilled') {
          const parsed = parseStockList(stockResult.value)
          if (!parsed) {
            setStocks([])
            setListError('The market service returned an unreadable quote list.')
          } else if (down) {
            setStocks([])
          } else {
            const rows = parsed.items
              .map((item) => presentListedTick(item, parsed.dataSource, latest))
              .filter((item): item is NormalizedTick => item !== null)
              .filter((item) => exchange === 'ALL' || item.exchange === exchange)
            setStocks(rows)
          }
        } else if (!isAbortError(stockResult.reason)) {
          setStocks([])
          setListError(messageFrom(stockResult.reason))
        }

        if (indexResult.status === 'fulfilled') {
          const items = parseIndexList(indexResult.value)
          if (!items) {
            setIndexBook([])
            setIndexError('The market service returned an unreadable index list.')
          } else if (down) {
            setIndexBook([])
          } else {
            setIndexBook(items.map((item) => presentTick(item, latest)).filter((item): item is NormalizedTick => item !== null))
          }
        } else if (!isAbortError(indexResult.reason)) {
          setIndexBook([])
          setIndexError(messageFrom(indexResult.reason))
        }
      } catch (error) {
        if (!active || isAbortError(error)) return
        setStocks([])
        setIndexBook([])
        setListError(messageFrom(error))
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [query, exchange, reloadKey, commitStatus])

  const retry = useCallback(() => {
    setReloadKey((value) => value + 1)
  }, [])

  return {
    feed,
    feedError,
    listError,
    indexError,
    loading,
    stocks,
    indices: visibleIndices,
    socketStatus,
    retry,
  }
}
