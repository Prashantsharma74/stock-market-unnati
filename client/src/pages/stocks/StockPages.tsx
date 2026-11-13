import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExploreGrowwLayout } from '../../components/explore/ExploreGrowwLayout.tsx'
import { useDashboardData } from '../../features/dashboard/useDashboard.ts'
import { useWatchlist } from '../../features/watchlist/useWatchlist.ts'
import { useLiveExplore } from '../../features/market/useLiveExplore.ts'
import { sketchSeries } from '../../data/sampleMarket.ts'
import { formatInr, formatPct } from '../../lib/format.ts'
import { useToast } from '../../components/ui/useToast.ts'
import { EmptyJourney } from '../../components/market/EmptyJourney.tsx'
import { Sparkline } from '../../components/market/Sparkline.tsx'
import { Skeleton } from '../../components/ui/Skeleton.tsx'

function StockTile({ id, name, symbol, price, changePct }: { id: string; name: string; symbol: string; price: number; changePct: number }) {
  const up = changePct >= 0
  return (
    <Link to={`/app/instruments/${id}`} className="group relative block rounded-2xl border border-line bg-white p-4 shadow-sm hover-lift">
      <div className="flex items-start justify-between gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-brand/10 text-[11px] font-semibold text-brand transition group-hover:bg-brand group-hover:text-white">{symbol.slice(0, 2)}</div>
        <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white opacity-0 transition duration-200 group-hover:opacity-100">View</span>
      </div>
      <p className="mt-4 line-clamp-2 min-h-10 text-sm font-medium transition group-hover:text-brand">{name}</p>
      <p className="mt-4 text-sm text-ink">{formatInr(price)}</p>
      <p className={`text-sm font-medium ${up ? 'text-gain' : 'text-loss'}`}>{formatPct(changePct)}</p>
    </Link>
  )
}

export function StocksExplorePage() {
  const live = useLiveExplore()

  return (
    <ExploreGrowwLayout
      india={live.india}
      us={live.us}
      loading={live.loading}
      error={live.error}
      feedHint={live.feedHint}
      onRetry={live.retry}
    />
  )
}

export function StockHoldingsPage() {
  const toast = useToast()
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <div className="space-y-4">
        <div className="flex gap-2 text-xs font-semibold text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-ink">Stocks</span>
        </div>
        <div className="rounded-2xl border border-line bg-white shadow-sm p-4">
          <p className="text-xs font-medium text-slate-500">Holdings (0)</p>
          <p className="mt-2 text-2xl font-semibold">₹0</p>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-dashed border-line pt-4 text-sm">
            <div>
              <p className="text-slate-500">Invested value</p>
              <p className="mt-1 font-medium">₹0</p>
            </div>
            <div>
              <p className="text-slate-500">1D returns</p>
              <p className="mt-1 font-medium text-slate-500">₹0 (0.00%)</p>
            </div>
            <div>
              <p className="text-slate-500">Total returns</p>
              <p className="mt-1 font-medium text-slate-500">₹0 (0.00%)</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white shadow-sm p-4">
          <div>
            <p className="text-sm font-semibold">Track external stocks</p>
            <p className="mt-1 text-sm text-slate-500">Broker import is not connected. This workspace cannot pull holdings from another platform.</p>
          </div>
          <button className="shrink-0 rounded-lg bg-accent/15 px-4 py-2 text-sm font-semibold text-accent-dark" onClick={() => toast('Broker import is not connected.', 'info')}>
            Track
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-white shadow-sm">
        <EmptyJourney
          title="Your investing journey begins here"
          body="Stock orders are not available. Explore the sample list to see how a quote is presented."
          action={<Link to="/app/stocks/explore" className="inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md">Explore stocks</Link>}
        />
      </div>
    </div>
  )
}

export function StockPositionsPage() {
  const { snapshot, status } = useDashboardData()
  const [cap, setCap] = useState<'All' | 'Large' | 'Mid' | 'Small'>('All')
  const caps: Record<string, 'Large' | 'Mid' | 'Small'> = {
    'stock-samplebank': 'Large',
    'stock-orbitsoft': 'Large',
    'stock-rivergrid': 'Mid',
    'stock-lotuschem': 'Small',
  }
  if (status !== 'ready' || !snapshot) return <Skeleton className="h-64 w-full" />
  const gainers = snapshot.popularStocks.filter((stock) => cap === 'All' || caps[stock.id] === cap)

  return (
    <div>
      <EmptyJourney title="No open positions" body="Intraday and delivery positions will appear here. Trading is not connected, so this list stays empty." />
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Top gainers</h2>
        <p className="text-xs text-slate-500">Sample day move</p>
      </div>
      <div className="mt-3 flex gap-2">
        {(['All', 'Large', 'Mid', 'Small'] as const).map((item) => (
          <button key={item} className={`rounded-lg px-3 py-1 text-sm transition duration-200 hover:-translate-y-0.5 ${cap === item ? 'bg-brand text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-line hover:text-brand'}`} onClick={() => setCap(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {gainers.map((stock) => (
          <StockTile key={stock.id} {...stock} />
        ))}
      </div>
    </div>
  )
}

export function StockOrdersPage() {
  const { snapshot, status } = useDashboardData()
  const [showAll, setShowAll] = useState(false)
  if (status !== 'ready' || !snapshot) return <Skeleton className="h-64 w-full" />

  return (
    <div>
      <EmptyJourney
        title="You don't have any open orders"
        body="Unnati cannot send orders to an exchange. Sample history below is labelled simulated."
        action={
          <button className="rounded-full border border-line px-4 py-2 text-sm font-medium" onClick={() => setShowAll(true)}>
            All orders
          </button>
        }
      />
      {showAll ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Instrument</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.transactions.map((order) => (
                <tr key={order.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{order.name}</td>
                  <td className="px-4 py-3">{order.kind}</td>
                  <td className="px-4 py-3">{formatInr(order.amount)}</td>
                  <td className="px-4 py-3 text-amber-700">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

export function StockWatchlistPage() {
  const { snapshot, status } = useDashboardData()
  const { watch, addStock } = useWatchlist()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)

  if (status !== 'ready' || !snapshot) return <Skeleton className="h-64 w-full" />
  const needle = query.trim().toLowerCase()
  const stocks = snapshot.popularStocks
  const rows = stocks.filter((stock) => watch.stockIds.includes(stock.id) && (!needle || stock.name.toLowerCase().includes(needle) || stock.symbol.toLowerCase().includes(needle)))

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="text-sm font-semibold">My watchlist</p>
        <div className="flex gap-2">
          <button className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand" onClick={() => setAdding((open) => !open)}>
            + Add stocks
          </button>
          <button className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand" onClick={() => setEditing((open) => !open)}>
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>
      <div className="px-4 py-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your watchlist" className="h-10 w-full max-w-xs rounded-lg border border-line px-3 text-sm outline-none focus:border-brand" />
      </div>
      {adding ? (
        <div className="grid gap-2 border-y border-slate-100 px-4 py-3 sm:grid-cols-2">
          {stocks.filter((stock) => !watch.stockIds.includes(stock.id)).map((stock) => (
            <button key={stock.id} className="rounded-lg border border-line px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 hover:border-brand hover:bg-brand/5" onClick={() => addStock(stock.id)}>
              Add {stock.symbol}
            </button>
          ))}
          {stocks.every((stock) => watch.stockIds.includes(stock.id)) ? <p className="text-sm text-slate-500">Every sample stock is already on the list.</p> : null}
        </div>
      ) : null}
      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-500">Nothing in this watchlist yet. Add a sample stock to track its simulated move.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Trend</th>
                <th className="px-4 py-2 font-medium">Mkt price</th>
                <th className="px-4 py-2 font-medium">1D change</th>
                {editing ? <th className="px-4 py-2 font-medium"> </th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((stock) => (
                <tr key={stock.id} className="border-t border-slate-100 transition hover:bg-accent/10">
                  <td className="px-4 py-3">
                    <Link to={`/app/instruments/${stock.id}`} className="font-medium transition hover:text-brand">{stock.name}</Link>
                    <p className="text-xs text-slate-500">{stock.symbol}</p>
                  </td>
                  <td className="px-4 py-3"><Sparkline values={sketchSeries(stock.price, stock.changePct)} positive={stock.changePct >= 0} /></td>
                  <td className="px-4 py-3">{formatInr(stock.price)}</td>
                  <td className={`px-4 py-3 font-medium ${stock.changePct >= 0 ? 'text-gain' : 'text-loss'}`}>{formatPct(stock.changePct)}</td>
                  {editing ? (
                    <td className="px-4 py-3">
                      <button className="rounded-md px-2 py-1 text-sm font-medium text-loss transition hover:bg-loss/10" onClick={() => addStock(stock.id)}>Remove</button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Saved in this browser for your account. Prices are simulated.</p>
    </div>
  )
}