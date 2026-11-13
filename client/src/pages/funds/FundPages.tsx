import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardData } from '../../features/dashboard/useDashboard.ts'
import { useWatchlist } from '../../features/watchlist/useWatchlist.ts'
import { formatDate, formatInr, formatPct } from '../../lib/format.ts'
import { EmptyJourney } from '../../components/market/EmptyJourney.tsx'
import { Skeleton } from '../../components/ui/Skeleton.tsx'
import { useToast } from '../../components/ui/useToast.ts'
import type { DashboardSnapshot } from '../../types/models.ts'

const collections = [
  { label: 'Equity', match: 'Equity' },
  { label: 'Debt', match: 'Debt' },
  { label: 'Hybrid', match: 'Hybrid' },
  { label: 'Large Cap', match: 'Large' },
  { label: 'Mid Cap', match: 'Mid' },
  { label: 'Small Cap', match: 'Small' },
  { label: 'ELSS', match: 'ELSS' },
  { label: 'Index', match: 'Index' },
]

function matches(category: string, token: string) {
  return category.toLowerCase().includes(token.toLowerCase())
}

export function FundsExplorePage() {
  const { snapshot, status } = useDashboardData()
  const { watch, addFund } = useWatchlist()
  const [collection, setCollection] = useState('Equity')
  if (status !== 'ready' || !snapshot) return <Skeleton className="h-64 w-full" />
  const token = collections.find((item) => item.label === collection)?.match ?? 'Equity'
  const filtered = snapshot.holdings.filter((fund) => matches(fund.category, token))
  const summary = snapshot.summary

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-8">
        <section>
          <h1 className="font-display text-3xl font-semibold">Best picks in this sample</h1>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {snapshot.topFunds.map((fund) => (
              <Link key={fund.id} to={`/app/instruments/${fund.id}`} className="group rounded-2xl border border-line bg-white p-4 shadow-sm hover-lift">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 transition group-hover:text-accent-dark">{fund.category}</p>
                <p className="mt-2 line-clamp-3 min-h-14 text-sm font-medium transition group-hover:text-brand">{fund.name}</p>
                <p className="mt-4 text-sm font-semibold text-gain">{formatPct(fund.scenarioGainPct)}</p>
                <p className="text-xs text-slate-400">Demo gain</p>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Collections</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {collections.map((item) => (
              <button key={item.label} className={`min-w-24 rounded-2xl border px-3 py-4 text-sm font-medium transition duration-200 hover:-translate-y-0.5 ${collection === item.label ? 'border-accent bg-accent/10 text-ink shadow-sm' : 'border-line bg-white text-slate-600 hover:border-accent/60'}`} onClick={() => setCollection(item.label)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {filtered.length === 0 ? <p className="rounded-xl border border-dashed border-line px-4 py-6 text-sm text-slate-500">No sample fund in {collection} yet.</p> : null}
            {filtered.map((fund) => (
              <div key={fund.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-sm transition hover:border-accent/50 hover:bg-accent/5">
                <Link to={`/app/instruments/${fund.id}`} className="text-sm font-medium transition hover:text-brand">{fund.name}</Link>
                <button className="rounded-lg px-3 py-1 text-sm font-medium text-brand transition hover:bg-brand hover:text-white" onClick={() => addFund(fund.id)}>
                  {watch.fundIds.includes(fund.id) ? 'Watching' : 'Watch'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-white shadow-sm p-4">
          <h2 className="text-sm font-semibold">Your investments</h2>
          <p className="mt-4 text-xs text-slate-500">Current</p>
          <p className="text-2xl font-semibold">{formatInr(summary.portfolioValue)}</p>
          <div className="mt-4 space-y-2 border-t border-dashed border-line pt-4 text-sm">
            <Row label="1D returns" value={`${formatInr(summary.todayChange)} (${formatPct(summary.todayChangePct)})`} positive={summary.todayChange >= 0} />
            <Row label="Total returns" value={`${formatInr(summary.returns)} (${formatPct(summary.returnsPct)})`} positive />
            <Row label="Invested" value={formatInr(summary.invested)} />
          </div>
          <p className="mt-3 text-xs text-slate-400">Shared sample portfolio, not your live folios.</p>
        </div>
        <div className="rounded-2xl border border-line bg-white shadow-sm p-4">
          <h2 className="text-sm font-semibold">Products and tools</h2>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            <li><Link className="block py-3 transition hover:translate-x-1 hover:text-brand" to="/app/calculators">SIP calculator</Link></li>
            <li><Link className="block py-3 transition hover:translate-x-1 hover:text-brand" to="/app/funds/dashboard">Mutual fund dashboard</Link></li>
            <li><Link className="block py-3 transition hover:translate-x-1 hover:text-brand" to="/app/funds/sips">SIPs</Link></li>
          </ul>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={positive === undefined ? 'font-medium' : positive ? 'font-medium text-gain' : 'font-medium text-loss'}>{value}</span>
    </div>
  )
}

export function FundsDashboardPage() {
  const toast = useToast()
  const { snapshot, status } = useDashboardData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  if (status !== 'ready' || !snapshot) return <Skeleton className="h-64 w-full" />
  const selected = snapshot.holdings.find((fund) => fund.id === selectedId) ?? null

  return (
    <InvestmentTable
      title={`Investments (${snapshot.holdings.length})`}
      snapshot={snapshot}
      selectedId={selected?.id ?? null}
      onSelect={setSelectedId}
      side={
        selected ? (
          <div className="flex h-full flex-col justify-between p-5">
            <div>
              <h2 className="text-base font-semibold">{selected.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{selected.category}</p>
              <p className="mt-4 text-2xl font-semibold">{formatInr(selected.current)}</p>
            </div>
            <div className="mt-6 space-y-2">
              <Link to={`/app/instruments/${selected.id}`} className="block rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md">View fund</Link>
              <button className="w-full rounded-full border border-line px-4 py-2.5 text-sm font-semibold" onClick={() => toast('Fund orders are not connected. No money is collected.', 'info')}>Invest</button>
            </div>
          </div>
        ) : (
          <EmptyJourney title="Select a fund" body="Choose a sample fund to see the actions available in this demo." />
        )
      }
    />
  )
}

export function SipsPage() {
  const { snapshot, status } = useDashboardData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  if (status !== 'ready' || !snapshot) return <Skeleton className="h-64 w-full" />
  const sips = snapshot.transactions.filter((item) => item.kind === 'SIP')
  const selected = snapshot.holdings.find((fund) => fund.name === sips.find((item) => item.id === selectedId)?.name) ?? null

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_280px]">
      <div className="rounded-2xl border border-line bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4">
          <h1 className="text-lg font-semibold">SIPs ({sips.length})</h1>
          <p className="mt-1 text-xs text-slate-500">Sample instalments. They were not paid from a bank account.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fund</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sips.map((sip) => (
                <tr key={sip.id} className={`cursor-pointer border-t border-line transition ${selectedId === sip.id ? 'bg-accent/10' : 'hover:bg-accent/10'}`} onClick={() => setSelectedId(sip.id)}>
                  <td className="px-4 py-3 font-medium">{sip.name}</td>
                  <td className="px-4 py-3">{formatDate(sip.date)}</td>
                  <td className="px-4 py-3">{formatInr(sip.amount)}</td>
                  <td className="px-4 py-3 text-amber-700">{sip.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-white shadow-sm">
        {selected ? (
          <div className="p-5">
            <h2 className="text-base font-semibold">{selected.name}</h2>
            <p className="mt-2 text-sm text-slate-500">Current sample value {formatInr(selected.current)}</p>
            <Link to={`/app/instruments/${selected.id}`} className="mt-6 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md">View fund</Link>
          </div>
        ) : (
          <EmptyJourney title="Select a SIP" body="Pick a sample instalment to open the fund." />
        )}
      </div>
    </div>
  )
}

export function FundWatchlistPage() {
  const { snapshot, status } = useDashboardData()
  const { watch, addFund } = useWatchlist()
  const rows = useMemo(() => snapshot?.holdings.filter((fund) => watch.fundIds.includes(fund.id)) ?? [], [snapshot, watch.fundIds])
  if (status !== 'ready' || !snapshot) return <Skeleton className="h-64 w-full" />

  if (rows.length === 0) {
    return (
      <div className="grid items-center gap-6 py-10 md:grid-cols-2">
        <EmptyJourney title="" body="" />
        <div>
          <h1 className="font-display text-3xl font-semibold">Not watching any funds</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Keep a watch on sample funds you want to revisit. Nothing here is a live scheme alert.</p>
          <Link to="/app/funds/explore" className="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md">Explore all funds</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold">Fund watchlist</h1>
        <Link to="/app/funds/explore" className="text-sm font-medium text-brand">Add from explore</Link>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.map((fund) => (
          <li key={fund.id} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-accent/10">
            <Link to={`/app/instruments/${fund.id}`} className="text-sm font-medium transition hover:text-brand">{fund.name}</Link>
            <button className="rounded-md px-2 py-1 text-sm font-medium text-loss transition hover:bg-loss/10" onClick={() => addFund(fund.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function InvestmentTable({
  title,
  snapshot,
  selectedId,
  onSelect,
  side,
}: {
  title: string
  snapshot: DashboardSnapshot
  selectedId: string | null
  onSelect: (id: string) => void
  side: ReactNode
}) {
  const summary = snapshot.summary
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_280px]">
      <div className="rounded-2xl border border-line bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="mt-3 text-xs text-slate-500">Current value</p>
          <p className="text-2xl font-semibold">{formatInr(summary.portfolioValue)}</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-slate-500">Invested value</p>
              <p className="font-medium">{formatInr(summary.invested)}</p>
            </div>
            <div>
              <p className="text-slate-500">1D returns</p>
              <p className={summary.todayChange >= 0 ? 'font-medium text-gain' : 'font-medium text-loss'}>{formatInr(summary.todayChange)} ({formatPct(summary.todayChangePct)})</p>
            </div>
            <div>
              <p className="text-slate-500">Total returns</p>
              <p className="font-medium text-gain">{formatInr(summary.returns)} ({formatPct(summary.returnsPct)})</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fund name</th>
                <th className="px-4 py-3 font-medium">Return %</th>
                <th className="px-4 py-3 font-medium">Day change</th>
                <th className="px-4 py-3 font-medium">Returns</th>
                <th className="px-4 py-3 font-medium">Current</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.holdings.map((fund) => (
                <tr key={fund.id} className={`cursor-pointer border-t border-line transition ${selectedId === fund.id ? 'bg-accent/10' : 'hover:bg-accent/10'}`} onClick={() => onSelect(fund.id)}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{fund.name}</p>
                    <p className="text-xs text-slate-400">{fund.category}</p>
                  </td>
                  <td className="px-4 py-3 text-gain">{formatPct(fund.returnsPct)}</td>
                  <td className={`px-4 py-3 ${fund.dayChange >= 0 ? 'text-gain' : 'text-loss'}`}>{formatInr(fund.dayChange)} ({formatPct(fund.dayChangePct)})</td>
                  <td className="px-4 py-3 text-gain">{formatInr(fund.returns)}</td>
                  <td className="px-4 py-3">
                    <p>{formatInr(fund.current)}</p>
                    <p className="text-xs text-slate-400">{formatInr(fund.invested)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-white shadow-sm">{side}</div>
    </div>
  )
}
