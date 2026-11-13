import type { MarketExchange } from './market.types'

export type SubscriptionTarget = {
  subscribe(symbol: string, exchange: MarketExchange): Promise<void>
  unsubscribe(symbol: string, exchange: MarketExchange): Promise<void>
}

export type SubscriptionEntry = {
  symbol: string
  exchange: MarketExchange
  count: number
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase()
}

function subscriptionId(exchange: MarketExchange, symbol: string) {
  return `${exchange}:${normalizeSymbol(symbol)}`
}

export function createSubscriptionRegistry(target: SubscriptionTarget) {
  const counts = new Map<string, number>()
  const openings = new Map<string, Promise<void>>()

  async function subscribe(symbol: string, exchange: MarketExchange) {
    const name = normalizeSymbol(symbol)
    const id = subscriptionId(exchange, name)
    const current = counts.get(id) ?? 0
    counts.set(id, current + 1)

    const opening = openings.get(id)
    if (opening) {
      await opening
      return counts.get(id) ?? 0
    }

    if (current > 0) return current + 1

    let pending: Promise<void>
    try {
      pending = Promise.resolve(target.subscribe(name, exchange)).then(
        () => undefined,
        (error: unknown) => {
          counts.delete(id)
          throw error
        },
      )
    } catch (error) {
      counts.delete(id)
      throw error
    }
    openings.set(id, pending)

    try {
      await pending
    } finally {
      if (openings.get(id) === pending) openings.delete(id)
    }

    return counts.get(id) ?? 0
  }

  async function unsubscribe(symbol: string, exchange: MarketExchange) {
    const name = normalizeSymbol(symbol)
    const id = subscriptionId(exchange, name)
    const opening = openings.get(id)
    if (opening) {
      try {
        await opening
      } catch {
        return 0
      }
    }

    const current = counts.get(id) ?? 0
    if (current <= 0) return 0
    if (current === 1) {
      counts.delete(id)
      await target.unsubscribe(name, exchange)
      return 0
    }

    counts.set(id, current - 1)
    return current - 1
  }

  function count(symbol: string, exchange: MarketExchange) {
    return counts.get(subscriptionId(exchange, symbol)) ?? 0
  }

  function entries(): SubscriptionEntry[] {
    return [...counts.entries()].map(([id, subscribers]) => {
      const splitAt = id.indexOf(':')
      return {
        exchange: id.slice(0, splitAt) as MarketExchange,
        symbol: id.slice(splitAt + 1),
        count: subscribers,
      }
    })
  }

  return { subscribe, unsubscribe, count, entries }
}
