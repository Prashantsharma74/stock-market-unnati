import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert.tsx'
import { Badge } from '../../components/ui/Badge.tsx'
import { Skeleton } from '../../components/ui/Skeleton.tsx'
import { formatPct } from '../../lib/format.ts'
import { normalizeSymbolQuery } from './api.ts'
import { formatQuoteAmount, quoteCurrency } from './quoteFormat.ts'
import { feedServesQuotes, sourceText } from './parse.ts'
import type { ExchangeFilter, MarketExchange, MarketStatus, NormalizedTick } from './types.ts'
import { feedConnectingMessage, feedDownMessage, sampleDataLabel } from './types.ts'
import { IndiaCatalogPanel } from './IndiaCatalogPanel.tsx'
import { useMarketBoard } from './useMarketBoard.ts'

const exchangeFilters: { id: ExchangeFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'US', label: 'US' },
  { id: 'HK', label: 'HK' },
  { id: 'SH', label: 'SH' },
  { id: 'SZ', label: 'SZ' },
  { id: 'JP', label: 'JP' },
  { id: 'KS', label: 'KS' },
  { id: 'IN', label: 'IN' },
  { id: 'TW', label: 'TW' },
  { id: 'NSE', label: 'NSE' },
  { id: 'BSE', label: 'BSE' },
  { id: 'SAMPLE', label: 'SAMPLE' },
]

type ChipTone = 'gain' | 'loss' | 'accent' | 'muted'

const chipTones: Record<ChipTone, string> = {
  gain: 'bg-gain/10 text-gain',
  loss: 'bg-loss/10 text-loss',
  accent: 'bg-accent/15 text-accent-dark',
  muted: 'bg-white text-slate-600 ring-1 ring-line',
}

function formatSignedAmount(value: number, exchange: MarketExchange) {
  return new Intl.NumberFormat(exchange === 'US' ? 'en-US' : 'en-IN', {
    style: 'currency',
    currency: quoteCurrency(exchange),
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
    signDisplay: 'exceptZero',
  }).format(value)
}

function changeKnown(tick: NormalizedTick) {
  return !tick.label?.includes('Previous close was not included')
}

function formatCheckedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

function changeClass(value: number) {
  if (value > 0) return 'text-gain'
  if (value < 0) return 'text-loss'
  return 'text-slate-500'
}

function feedChip(feed: MarketStatus | null, loading: boolean): { label: string; tone: ChipTone } {
  if (!feed) return { label: loading ? 'Checking' : 'Unavailable', tone: loading ? 'muted' : 'loss' }
  switch (feed.connection) {
    case 'connected':
      return { label: 'Connected', tone: 'gain' }
    case 'mock':
      return { label: 'Sample data', tone: 'accent' }
    case 'connecting':
      return { label: 'Connecting', tone: 'accent' }
    case 'disconnected':
      return { label: 'Disconnected', tone: 'loss' }
    case 'unconfigured':
      return { label: 'Not configured', tone: 'loss' }
  }
}

function StatusChip({ label, value, tone }: { label: string; value: string; tone: ChipTone }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${chipTones[tone]}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
      {value}
    </span>
  )
}

function panelMessage(feed: MarketStatus) {
  return feed.connection === 'connecting' ? feedConnectingMessage : feedDownMessage
}

function visibleQuote(tick: NormalizedTick, selected: ExchangeFilter) {
  if (tick.label === sampleDataLabel) return false
  if (tick.source === 'mock') return tick.exchange === 'SAMPLE' && (selected === 'ALL' || selected === 'SAMPLE')
  if (tick.source !== 'provider' || tick.exchange === 'SAMPLE') return false
  return selected === 'ALL' || tick.exchange === selected
}

function QuoteNumbers({ tick }: { tick: NormalizedTick }) {
  return (
    <>
      <p className="font-display text-2xl font-semibold tabular-nums text-ink">{formatQuoteAmount(tick.ltp, tick.exchange)}</p>
      <p className={`mt-1 text-sm font-medium tabular-nums ${changeKnown(tick) ? changeClass(tick.change) : 'text-slate-500'}`}>
        {changeKnown(tick)
          ? `${formatSignedAmount(tick.change, tick.exchange)} (${formatPct(tick.changePct)})`
          : 'Previous close was not included'}
      </p>
    </>
  )
}

function SourceLine({ tick }: { tick: NormalizedTick }) {
  const text = sourceText(tick)
  return <p className={`text-xs leading-5 ${tick.source === 'mock' ? 'text-accent-dark' : 'text-slate-500'}`}>{text}</p>
}

export function MarketPage() {
  const location = useLocation()
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [exchange, setExchange] = useState<ExchangeFilter>('ALL')
  const board = useMarketBoard(query, exchange)

  useEffect(() => {
    const state = location.state as { symbol?: string; exchange?: MarketExchange } | null
    if (!state?.symbol) return
    const sym = normalizeSymbolQuery(state.symbol)
    setDraft(sym)
    setQuery(sym)
    if (state.exchange) setExchange(state.exchange)
  }, [location.key, location.state])
  const feedDown = board.feed !== null && !feedServesQuotes(board.feed)
  const stockRows = feedDown ? [] : board.stocks.filter((tick) => visibleQuote(tick, exchange))
  const indexRows = feedDown ? [] : board.indices.filter((tick) => visibleQuote(tick, exchange))
  const chip = feedChip(board.feed, board.loading)
  const socketTone: ChipTone = board.socketStatus === 'connected' ? 'gain' : 'loss'
  const detail = board.feed && board.feed.message.trim() && board.feed.message.trim() !== panelMessage(board.feed) ? board.feed.message.trim() : ''
  const showListError = Boolean(board.listError && !(feedDown && (board.listError === feedDownMessage || board.listError === feedConnectingMessage)))

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(draft), 300)
    return () => window.clearTimeout(timer)
  }, [draft])

  const emptyDetail = query
    ? `No quote was returned for ${query}${exchange === 'ALL' ? '' : ` on ${exchange}`}.`
    : exchange === 'ALL'
      ? 'The market service returned no quotes.'
      : `The market service returned no quotes for ${exchange}.`

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-dark">Unnati market service</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">Market feed</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Quotes appear here only when the market service returns them.</p>
        </div>
        <div className="flex flex-col items-start gap-2" aria-live="polite">
          <div className="flex flex-wrap gap-2">
            <StatusChip label="Feed" value={chip.label} tone={chip.tone} />
            <StatusChip label="Socket" value={board.socketStatus === 'connected' ? 'Connected' : 'Disconnected'} tone={socketTone} />
          </div>
          <p className="text-xs text-slate-500">{board.feed ? `Last checked ${formatCheckedAt(board.feed.checkedAt)}` : 'Waiting for a status check.'}</p>
        </div>
      </header>

      {board.feed?.connection === 'mock' ? (
        <p className="rounded-2xl bg-accent/15 px-4 py-3 text-sm leading-6 text-accent-dark">{sampleDataLabel}</p>
      ) : null}

      {board.feedError ? <Alert tone="error">{board.feedError}</Alert> : null}
      {showListError ? <Alert tone="error">{board.listError}</Alert> : null}
      {board.indexError && !feedDown ? <Alert tone="warning">{board.indexError}</Alert> : null}

      <form
        role="search"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault()
          setQuery(draft)
        }}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="market-symbol" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Symbol
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              id="market-symbol"
              value={draft}
              maxLength={20}
              autoComplete="off"
              spellCheck={false}
              placeholder="Search symbol"
              aria-label="Search market symbols"
              onChange={(event) => setDraft(normalizeSymbolQuery(event.target.value))}
              className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
        </div>
        <div>
          <p id="market-exchange-label" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Exchange
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="market-exchange-label">
            {exchangeFilters.map((item) => {
              const selected = exchange === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${selected ? 'bg-brand text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-line hover:text-brand'}`}
                  onClick={() => setExchange(item.id)}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </form>

      <div aria-live="polite" aria-busy={board.loading}>
        {feedDown && board.feed ? (
          <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center" role="status">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-dark">Feed status</p>
            <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight text-ink">{panelMessage(board.feed)}</h2>
            {detail ? <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">{detail}</p> : null}
            <button type="button" className="mt-6 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark" onClick={board.retry}>
              Check again
            </button>
          </div>
        ) : null}

        {!feedDown && board.loading && stockRows.length === 0 ? (
          <div className="mb-6 space-y-3">
            <p className="sr-only">Loading market quotes</p>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}

        {!feedDown && indexRows.length > 0 ? (
          <section className="mb-6" aria-label="Indices">
            <h2 className="text-sm font-semibold text-ink">Indices</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {indexRows.map((tick) => (
                <li key={`${tick.exchange}:${tick.symbol}`} className="rounded-2xl border border-line bg-white p-4 shadow-[0_12px_30px_-22px_rgba(42,61,120,0.55)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{tick.symbol}</p>
                    <Badge tone={tick.source === 'mock' ? 'simulated' : 'neutral'}>{tick.exchange}</Badge>
                  </div>
                  <div className="mt-3">
                    <QuoteNumbers tick={tick} />
                  </div>
                  <div className="mt-3">
                    <SourceLine tick={tick} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!feedDown && !board.loading && !board.listError && stockRows.length === 0 && indexRows.length > 0 ? (
          <p className="mb-6 text-sm text-slate-600">{emptyDetail}</p>
        ) : null}

        {!feedDown && !board.loading && !board.listError && stockRows.length > 0 ? (
          <section aria-label="Symbols">
            <h2 className="text-sm font-semibold text-ink">Symbols</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_12px_30px_-22px_rgba(42,61,120,0.55)]">
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">Quotes returned by the market service</caption>
                <thead className="bg-paper text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Symbol</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Exchange</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">LTP</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Change</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Change %</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRows.map((tick) => (
                    <tr key={`${tick.exchange}:${tick.symbol}`} className="border-t border-line">
                      <th scope="row" className="px-4 py-3 font-semibold text-ink">{tick.symbol}</th>
                      <td className="px-4 py-3">
                        <Badge tone={tick.source === 'mock' ? 'simulated' : 'neutral'}>{tick.exchange}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-ink">{formatQuoteAmount(tick.ltp, tick.exchange)}</td>
                      <td className={`px-4 py-3 text-right font-medium tabular-nums ${changeKnown(tick) ? changeClass(tick.change) : 'text-slate-500'}`}>
                        {changeKnown(tick) ? formatSignedAmount(tick.change, tick.exchange) : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium tabular-nums ${changeKnown(tick) ? changeClass(tick.changePct) : 'text-slate-500'}`}>
                        {changeKnown(tick) ? formatPct(tick.changePct) : '—'}
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <SourceLine tick={tick} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!feedDown && !board.loading && !board.listError && !board.feedError && stockRows.length === 0 && indexRows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-14 text-center" role="status">
            <h2 className="font-display text-2xl font-semibold text-ink">No quotes were returned</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{emptyDetail}</p>
          </div>
        ) : null}
      </div>

      <IndiaCatalogPanel
        onPick={(localSymbol) => {
          const sym = normalizeSymbolQuery(localSymbol)
          setDraft(sym)
          setQuery(sym)
          setExchange('IN')
        }}
      />
    </div>
  )
}
