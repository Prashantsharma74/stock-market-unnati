import type { MarketExchange } from './types.ts'

export function quoteCurrency(exchange: MarketExchange) {
  switch (exchange) {
    case 'US':
      return 'USD'
    case 'HK':
      return 'HKD'
    case 'SH':
    case 'SZ':
      return 'CNY'
    case 'JP':
      return 'JPY'
    case 'KS':
      return 'KRW'
    case 'TW':
      return 'TWD'
    default:
      return 'INR'
  }
}

export function formatQuoteAmount(value: number, exchange: MarketExchange) {
  return new Intl.NumberFormat(exchange === 'US' ? 'en-US' : 'en-IN', {
    style: 'currency',
    currency: quoteCurrency(exchange),
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
}

export function formatSignedQuoteAmount(value: number, exchange: MarketExchange) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${formatQuoteAmount(Math.abs(value), exchange)}`
}

/** Groww-style row: -3.70 (2.23%) — amount without currency, % magnitude in parentheses. */
export function formatGrowwChangeLine(change: number, changePct: number, exchange: MarketExchange) {
  if (!Number.isFinite(change) || !Number.isFinite(changePct)) return '—'
  if (change === 0 && changePct === 0) return '0.00 (0.00%)'

  const locale = exchange === 'US' ? 'en-US' : 'en-IN'
  const amount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(change))
  const sign = change > 0 ? '+' : change < 0 ? '-' : ''
  const pct = `(${Math.abs(changePct).toFixed(2)}%)`
  return `${sign}${amount} ${pct}`
}
