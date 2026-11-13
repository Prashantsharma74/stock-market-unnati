import { Link } from 'react-router-dom'
import { sampleIndices, sketchSeries } from '../../data/sampleMarket.ts'
import { useDashboardData } from '../../features/dashboard/useDashboard.ts'
import { formatInr, formatPct } from '../../lib/format.ts'
import { EmptyJourney } from '../../components/market/EmptyJourney.tsx'
import { Sparkline } from '../../components/market/Sparkline.tsx'
import { Skeleton } from '../../components/ui/Skeleton.tsx'
import { useToast } from '../../components/ui/useToast.ts'

export function FoExplorePage() {
  const toast = useToast()
  const { snapshot, status } = useDashboardData()
  if (status !== 'ready' || !snapshot) return <Skeleton className="h-64 w-full" />

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section>
        <h1 className="font-display text-3xl font-semibold">Top traded</h1>
        <p className="mt-1 text-xs text-slate-500">Illustrative paths only. Futures and options cannot be traded here.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sampleIndices.slice(0, 3).map((item) => (
            <Link key={item.id} to={`/app/instruments/${item.id}`} className="group rounded-2xl border border-line bg-white p-4 shadow-sm hover-lift">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold transition group-hover:text-brand">{item.name}</p>
                <Sparkline values={sketchSeries(item.pct, item.pct)} positive={item.pct >= 0} />
              </div>
              <p className="mt-3 text-sm">{item.value}</p>
              <p className={`text-sm font-medium ${item.pct >= 0 ? 'text-gain' : 'text-loss'}`}>{formatPct(item.pct)}</p>
            </Link>
          ))}
          {snapshot.popularStocks.slice(0, 3).map((stock) => (
            <Link key={stock.id} to={`/app/instruments/${stock.id}`} className="group rounded-2xl border border-line bg-white p-4 shadow-sm hover-lift">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold transition group-hover:text-brand">{stock.symbol}</p>
                <Sparkline values={sketchSeries(stock.price, stock.changePct)} positive={stock.changePct >= 0} />
              </div>
              <p className="mt-3 text-sm">{formatInr(stock.price)}</p>
              <p className={`text-sm font-medium ${stock.changePct >= 0 ? 'text-gain' : 'text-loss'}`}>{formatPct(stock.changePct)}</p>
            </Link>
          ))}
        </div>
      </section>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-white shadow-sm p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Positions</h2>
            <Link to="/app/fo/positions" className="text-sm font-medium text-brand">Dashboard</Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">F&O returns</p>
          <p className="text-xl font-semibold">₹0.00</p>
        </div>
        <div className="rounded-2xl border border-line bg-white shadow-sm p-4">
          <h2 className="text-sm font-semibold">Products & tools</h2>
          <button className="mt-3 w-full rounded-lg border border-line px-3 py-3 text-left text-sm" onClick={() => toast('No broker or exchange connection is configured.', 'info')}>
            Option chain — not connected
          </button>
        </div>
      </aside>
    </div>
  )
}

export function FoPositionsPage() {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-2">
      <EmptyJourney title="You have no open positions" body="Start is not available. F&O orders are not connected to a broker." />
      <div className="rounded-2xl border border-line bg-white shadow-sm p-8 text-center">
        <h2 className="text-lg font-semibold">Your trading journey begins here</h2>
        <p className="mt-2 text-sm text-slate-500">Futures and options stay view-only in this demo.</p>
        <Link to="/app/fo/explore" className="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md">Explore now</Link>
      </div>
    </div>
  )
}

export function FoOrdersPage() {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-2">
      <EmptyJourney title="You have no open orders" body="There is no order book because trading is not enabled." />
      <div className="rounded-2xl border border-line bg-white shadow-sm p-8 text-center">
        <h2 className="text-lg font-semibold">Your trading journey begins here</h2>
        <p className="mt-2 text-sm text-slate-500">Sample contracts can be browsed. They cannot be bought or sold.</p>
        <Link to="/app/fo/explore" className="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md">Explore now</Link>
      </div>
    </div>
  )
}
