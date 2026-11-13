import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronRight, Calculator, LineChart, PieChart, TrendingUp, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { exploreLabel } from '../../features/market/exploreLabels.ts'
import { formatGrowwChangeLine, formatQuoteAmount } from '../../features/market/quoteFormat.ts'
import type { NormalizedTick } from '../../features/market/types.ts'
import { exploreSampleBonds, type ExploreBond } from './exploreSampleBonds.ts'
import { Skeleton } from '../ui/Skeleton.tsx'

function LiveStockTile({ tick }: { tick: NormalizedTick }) {
  const name = exploreLabel(tick.symbol)
  const tileKey = `${tick.exchange}:${tick.symbol}`
  const baselineRef = useRef<{ key: string; price: number } | null>(null)
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null)
  const prevLtpRef = useRef(tick.ltp)

  if (!baselineRef.current || baselineRef.current.key !== tileKey) {
    baselineRef.current = { key: tileKey, price: tick.ltp }
  }

  useEffect(() => {
    const prev = prevLtpRef.current
    if (tick.ltp > prev) setPriceFlash('up')
    else if (tick.ltp < prev) setPriceFlash('down')
    prevLtpRef.current = tick.ltp
    if (tick.ltp === prev) return
    const timer = window.setTimeout(() => setPriceFlash(null), 700)
    return () => window.clearTimeout(timer)
  }, [tick.ltp])

  const hasProviderDay = Math.abs(tick.change) > 0.000_05 || Math.abs(tick.changePct) > 0.000_05
  const baseline = hasProviderDay && tick.previousClose > 0 ? tick.previousClose : (baselineRef.current?.price ?? tick.ltp)
  const change = hasProviderDay ? tick.change : tick.ltp - baseline
  const changePct = hasProviderDay ? tick.changePct : baseline > 0 ? (change / baseline) * 100 : 0
  const hasMove = Math.abs(change) > 0.000_05 || Math.abs(changePct) > 0.000_05
  const up = change >= 0

  return (
    <Link
      to="/app/market"
      state={{ symbol: tick.symbol, exchange: tick.exchange }}
      className="group flex w-[188px] shrink-0 flex-col rounded-xl border border-slate-200/90 bg-white p-4 transition hover:border-slate-300 hover:shadow-[0_4px_20px_rgba(15,23,42,0.06)]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-xs font-semibold text-brand">
        {tick.symbol.slice(0, 2)}
      </div>
      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-slate-800">{name}</p>
      <div className="mt-3">
        <p
          className={`text-[15px] font-semibold tracking-tight text-slate-900 transition-colors duration-500 ${
            priceFlash === 'up' ? 'text-gain' : priceFlash === 'down' ? 'text-loss' : ''
          }`}
        >
          {formatQuoteAmount(tick.ltp, tick.exchange)}
        </p>
        <p className={`mt-1 text-[13px] font-medium tabular-nums ${hasMove ? (up ? 'text-gain' : 'text-loss') : 'text-slate-400'}`}>
          {hasMove ? formatGrowwChangeLine(change, changePct, tick.exchange) : '0.00 (0.00%)'}
        </p>
      </div>
    </Link>
  )
}

function BondTile({ bond }: { bond: ExploreBond }) {
  const ratingClass =
    bond.ratingTone === 'high' ? 'bg-gain' : bond.ratingTone === 'low' ? 'bg-amber-400' : 'bg-amber-300'
  return (
    <div className="flex w-[188px] shrink-0 flex-col rounded-xl border border-slate-200/90 bg-white p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-xs font-semibold text-slate-600">
        {bond.issuer.slice(0, 2).toUpperCase()}
      </div>
      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-slate-800">{bond.issuer}</p>
      <p className="mt-3 text-[15px] font-semibold text-slate-900">{bond.rate.toFixed(2)}%</p>
      <p className="mt-1 text-[13px] text-slate-500">{bond.months} months</p>
      <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
        <span className={`h-2 w-2 rounded-full ${ratingClass}`} aria-hidden />
        {bond.rating}
      </p>
    </div>
  )
}

function SectionHeader({ title, live, seeMoreTo }: { title: string; live?: boolean; seeMoreTo?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {live ? (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gain">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-gain align-middle" aria-hidden />
            Live
          </span>
        ) : null}
      </div>
      {seeMoreTo ? (
        <Link to={seeMoreTo} className="flex items-center gap-0.5 text-[13px] font-medium text-slate-500 hover:text-brand">
          See more
          <ChevronRight size={16} className="opacity-70" />
        </Link>
      ) : null}
    </div>
  )
}

function HorizontalRow({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  )
}

const productLinks = [
  { to: '/app/market', label: 'Market feed', icon: LineChart },
  { to: '/app/calculators', label: 'SIP calculator', icon: Calculator },
  { to: '/app/funds/explore', label: 'Mutual funds', icon: PieChart },
  { to: '/app/stocks/watchlist', label: 'Watchlist', icon: TrendingUp },
  { to: '/app/fo/explore', label: 'F&O', icon: Wallet },
]

export type ExploreGrowwLayoutProps = {
  india: NormalizedTick[]
  us: NormalizedTick[]
  loading: boolean
  error: string | null
  feedHint: string | null
  onRetry: () => void
}

export function ExploreGrowwLayout({ india, us, loading, error, feedHint, onRetry }: ExploreGrowwLayoutProps) {
  const hasLive = india.length > 0 || us.length > 0

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
      <div className="min-w-0 space-y-8 rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] md:p-6">
        {error ? <p className="rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p> : null}
        {feedHint ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{feedHint}</p> : null}
        {!loading && !hasLive ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-600">
            <p>No live quotes yet. Stay signed in and restart the API if you changed Infoway settings.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Link to="/app/market" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
                Market feed
              </Link>
              <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-brand" onClick={onRetry}>
                Retry
              </button>
            </div>
          </div>
        ) : null}

        <section>
          <SectionHeader title="Popular Indian stocks" live={india.length > 0} seeMoreTo="/app/market" />
          {loading ? (
            <HorizontalRow>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[148px] w-[188px] shrink-0 rounded-xl" />
              ))}
            </HorizontalRow>
          ) : india.length > 0 ? (
            <HorizontalRow>
              {india.map((tick) => (
                <LiveStockTile key={`${tick.exchange}:${tick.symbol}`} tick={tick} />
              ))}
            </HorizontalRow>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No India quotes on your Infoway plan yet.</p>
          )}
        </section>

        <section>
          <SectionHeader title="Popular US Stocks & ETFs" live={us.length > 0} seeMoreTo="/app/market" />
          {loading ? (
            <HorizontalRow>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[148px] w-[188px] shrink-0 rounded-xl" />
              ))}
            </HorizontalRow>
          ) : us.length > 0 ? (
            <HorizontalRow>
              {us.map((tick) => (
                <LiveStockTile key={`${tick.exchange}:${tick.symbol}`} tick={tick} />
              ))}
            </HorizontalRow>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              {feedHint ?? 'No US quotes returned. Check Infoway key in server/.env and Retry.'}
            </p>
          )}
        </section>

        <section>
          <SectionHeader title="Popular Bonds" seeMoreTo="/app/funds/explore" />
          <p className="mt-1 text-[11px] text-slate-400">Sample illustration — not live market data.</p>
          <HorizontalRow>
            {exploreSampleBonds.map((bond) => (
              <BondTile key={bond.id} bond={bond} />
            ))}
          </HorizontalRow>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h2 className="text-sm font-semibold text-slate-900">Your investments</h2>
          <div className="mt-6 flex flex-col items-center py-4 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-3xl" aria-hidden>
              📊
            </div>
            <p className="mt-4 text-sm text-slate-500">You haven&apos;t invested yet</p>
            <Link to="/app/stocks/holdings" className="mt-4 text-sm font-semibold text-brand hover:text-brand-dark">
              View holdings
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h2 className="text-sm font-semibold text-slate-900">Products &amp; tools</h2>
          <ul className="mt-2 space-y-0.5">
            {productLinks.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-brand"
                >
                  <Icon size={18} className="shrink-0 text-slate-400" strokeWidth={1.75} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
