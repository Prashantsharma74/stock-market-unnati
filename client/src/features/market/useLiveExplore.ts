import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getMarketExplore, getMarketStockQuote, isAbortError, messageFrom } from './api.ts'
import { parseExploreList } from './parseExplore.ts'
import { isNormalizedTick, subscriptionKey, uniqueSubscriptions } from './parse.ts'
import { createMarketSocket, emitStockSubscription, type MarketClientSocket } from './socket.ts'
import type { NormalizedTick } from './types.ts'

const socketCap = 10
const pollMs = 10_000

function replaceTick(list: NormalizedTick[], tick: NormalizedTick) {
  let changed = false
  const next = list.map((item) => {
    if (item.symbol !== tick.symbol || item.exchange !== tick.exchange) return item
    changed = true
    return tick
  })
  return changed ? next : list
}

export function useLiveExplore() {
  const [india, setIndia] = useState<NormalizedTick[]>([])
  const [us, setUs] = useState<NormalizedTick[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedHint, setFeedHint] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const stocks = useMemo(() => [...india, ...us], [india, us])

  const socketRef = useRef<MarketClientSocket | null>(null)
  const desiredRef = useRef<{ symbol: string; exchange: NormalizedTick['exchange'] }[]>([])

  const subscriptions = useMemo(() => uniqueSubscriptions(stocks).slice(0, socketCap), [stocks])
  const subscriptionSignature = subscriptions
    .map((item) => subscriptionKey(item.symbol, item.exchange))
    .sort()
    .join('|')

  const allowedRef = useRef(new Set<string>())
  allowedRef.current = new Set(subscriptions.map((item) => subscriptionKey(item.symbol, item.exchange)))

  useEffect(() => {
    const socket = createMarketSocket()
    socketRef.current = socket
    let alive = true

    const onConnect = () => {
      if (!alive) return
      for (const item of desiredRef.current) {
        emitStockSubscription(socket, 'subscribe:stock', item.symbol, item.exchange)
      }
    }

    const onTick = (payload: unknown) => {
      if (!alive) return
      if (!payload || typeof payload !== 'object') return
      const record = payload as NormalizedTick
      const key = subscriptionKey(record.symbol, record.exchange)
      if (!allowedRef.current.has(key)) return
      if (record.source !== 'provider') return
      setIndia((current) => replaceTick(current, record))
      setUs((current) => replaceTick(current, record))
    }

    socket.on('connect', onConnect)
    socket.on('stock:price', onTick)

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
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    const next = subscriptions
    const previous = desiredRef.current
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
    desiredRef.current = next
  }, [subscriptionSignature, subscriptions])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setError(null)
    setFeedHint(null)

    void (async () => {
      try {
        const raw = await getMarketExplore(controller.signal)
        if (!active) return
        const parsed = parseExploreList(raw)
        if (!parsed) {
          setIndia([])
          setUs([])
          setError('The market service returned an unreadable explore list.')
          return
        }
        if (parsed.dataSource !== 'provider') {
          setIndia([])
          setUs([])
          setFeedHint(
            parsed.feedMessage?.trim() ||
              'Explore could not load live quotes. Run the API from the server folder with MARKET_DATA_PROVIDER=infoway, then Retry.',
          )
          return
        }
        setIndia(parsed.india)
        setUs(parsed.us)
        if (parsed.feedMessage?.trim()) setFeedHint(parsed.feedMessage.trim())
      } catch (err) {
        if (!active || isAbortError(err)) return
        setIndia([])
        setUs([])
        setError(messageFrom(err))
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [reloadKey])

  const visibleKey = useMemo(
    () =>
      [...india, ...us]
        .map((tick) => subscriptionKey(tick.symbol, tick.exchange))
        .sort()
        .join('|'),
    [india, us],
  )

  const visibleRef = useRef<{ symbol: string; exchange: NormalizedTick['exchange'] }[]>([])
  visibleRef.current = [...india, ...us].map((tick) => ({ symbol: tick.symbol, exchange: tick.exchange }))

  useEffect(() => {
    if (loading || !visibleKey) return

    let active = true

    const refresh = async () => {
      for (const item of visibleRef.current) {
        if (!active) return
        try {
          const raw = await getMarketStockQuote(item.symbol, item.exchange)
          if (!active || !isNormalizedTick(raw)) continue
          const tick = raw
          setIndia((current) => replaceTick(current, tick))
          setUs((current) => replaceTick(current, tick))
        } catch {
          // Keep the last price when a poll fails (rate limit or feed down).
        }
        await new Promise((resolve) => setTimeout(resolve, 1200))
      }
    }

    void refresh()
    const timer = window.setInterval(() => {
      void refresh()
    }, pollMs)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [loading, visibleKey])

  const retry = useCallback(() => setReloadKey((value) => value + 1), [])

  return { india, us, loading, error, feedHint, retry }
}
