import { ArrowUpRight, PieChart, TrendingUp, Wallet } from 'lucide-react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart as AllocationChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppDispatch, useAppSelector } from '../app/hooks.ts'
import { Alert } from '../components/ui/Alert.tsx'
import { Badge } from '../components/ui/Badge.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Card } from '../components/ui/Card.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { Skeleton } from '../components/ui/Skeleton.tsx'
import { fetchDashboard } from '../features/dashboard/dashboardSlice.ts'
import { formatDate, formatInr, formatPct, toneForChange } from '../lib/format.ts'

const allocationColors = ['#2a3d78', '#e08a2a', '#1a7a4c']

function money(value: unknown) {
  const amount = Array.isArray(value) ? Number(value[0]) : Number(value)
  return formatInr(Number.isFinite(amount) ? amount : 0)
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

export function DashboardPage() {
  const dispatch = useAppDispatch()
  const { snapshot, status, error } = useAppSelector((state) => state.dashboard)

  useEffect(() => {
    document.title = 'Dashboard · Unnati'
    if (status === 'idle') void dispatch(fetchDashboard())
  }, [dispatch, status])

  if (status === 'idle' || status === 'loading') return <DashboardSkeleton />

  if (status === 'error' || !snapshot) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        body={error ?? 'The sample portfolio could not be loaded.'}
        action={<Button onClick={() => void dispatch(fetchDashboard())}>Try again</Button>}
      />
    )
  }

  const summary = snapshot.summary

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">{snapshot.asOfLabel}</p>
        </div>
        <Badge tone="simulated">Simulated</Badge>
      </div>

      <Alert tone="warning">
        {snapshot.disclaimer} Every account sees this same illustrative portfolio. It is not calculated from your orders.
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Wallet size={18} />} label="Portfolio value" value={formatInr(summary.portfolioValue)} detail="Sample holdings" />
        <Stat icon={<PieChart size={18} />} label="Invested" value={formatInr(summary.invested)} detail="Sample purchases" />
        <Stat icon={<TrendingUp size={18} />} label="Gain" value={formatInr(summary.returns)} detail={formatPct(summary.returnsPct)} positive />
        <Stat icon={<ArrowUpRight size={18} />} label="Today" value={formatInr(summary.todayChange)} detail={formatPct(summary.todayChangePct)} positive={summary.todayChange >= 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <h2 className="text-base font-semibold">Sample year path</h2>
          <p className="mt-1 text-sm text-slate-500">A smooth illustrative curve that ends at the demo portfolio value.</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshot.performance}>
                <defs>
                  <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2a3d78" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2a3d78" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e6ebf2" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value: number) => `${(value / 100000).toFixed(1)}L`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={money} />
                <Area type="monotone" dataKey="value" stroke="#2a3d78" fill="url(#valueFill)" strokeWidth={2} name="Value" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <h2 className="text-base font-semibold">Allocation</h2>
          <p className="mt-1 text-sm text-slate-500">Share of the sample current value.</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AllocationChart>
                <Pie data={snapshot.allocation} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none">
                  {snapshot.allocation.map((entry, index) => (
                    <Cell key={entry.name} fill={allocationColors[index % allocationColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={money} />
              </AllocationChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2">
            {snapshot.allocation.map((item, index) => (
              <li key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: allocationColors[index] }} />
                  {item.name}
                </span>
                <span className="font-medium">{formatInr(item.value)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <h2 className="text-base font-semibold">Mutual fund holdings</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Fund</th>
                  <th className="pb-3 font-medium">Invested</th>
                  <th className="pb-3 font-medium">Current</th>
                  <th className="pb-3 font-medium">Gain</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.holdings.map((holding) => (
                  <tr key={holding.id} className="border-t border-slate-100">
                    <td className="py-3">
                      <Link to={`/app/instruments/${holding.id}`} className="font-medium text-navy-900 hover:text-brand">
                        {holding.name}
                      </Link>
                      <p className="text-xs text-slate-500">{holding.category}</p>
                    </td>
                    <td>{formatInr(holding.invested)}</td>
                    <td>{formatInr(holding.current)}</td>
                    <td className={toneForChange(holding.returns)}>
                      {formatInr(holding.returns)}
                      <span className="ml-2">{formatPct(holding.returnsPct)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <h2 className="text-base font-semibold">Sample watchlist</h2>
          <p className="mt-1 text-sm text-slate-500">Read-only. Personal watchlists come later.</p>
          <ul className="mt-4 divide-y divide-slate-100">
            {snapshot.watchlist.map((stock) => (
              <li key={stock.id} className="flex items-center justify-between py-3">
                <Link to={`/app/instruments/${stock.id}`}>
                  <span className="block text-sm font-medium">{stock.name}</span>
                  <span className="text-xs text-slate-500">{stock.symbol}</span>
                </Link>
                <span className="text-right">
                  <span className="block text-sm font-medium">{formatInr(stock.price)}</span>
                  <span className={`text-xs font-medium ${toneForChange(stock.changePct)}`}>{formatPct(stock.changePct)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="text-base font-semibold">Recent sample transactions</h2>
          <ul className="mt-4 space-y-3">
            {snapshot.transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{transaction.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(transaction.date)} · {transaction.kind}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatInr(transaction.amount)}</p>
                  <Badge tone="simulated">{transaction.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Sample funds by demo gain</h2>
          <ul className="mt-4 space-y-3">
            {snapshot.topFunds.map((fund) => (
              <li key={fund.id}>
                <Link to={`/app/instruments/${fund.id}`} className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium">{fund.name}</span>
                    <span className="text-xs text-slate-500">{fund.category}</span>
                  </span>
                  <span className="text-sm font-semibold text-gain">{formatPct(fund.scenarioGainPct)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Market overview</h2>
          <ul className="mt-4 space-y-3">
            {snapshot.marketOverview.map((market) => (
              <li key={market.id}>
                <Link to={`/app/instruments/${market.id}`} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{market.name}</span>
                  <span className="text-right">
                    <span className="block text-sm font-medium">{market.level.toLocaleString('en-IN')}</span>
                    <span className={`text-xs font-medium ${toneForChange(market.changePct)}`}>{formatPct(market.changePct)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {snapshot.popularStocks.slice(0, 2).map((stock) => (
              <Link key={stock.id} to={`/app/instruments/${stock.id}`} className="rounded-2xl bg-mist px-3 py-2">
                <span className="block text-xs text-slate-500">{stock.symbol}</span>
                <span className={`text-sm font-semibold ${toneForChange(stock.changePct)}`}>{formatPct(stock.changePct)}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  detail,
  positive,
}: {
  icon: ReactNode
  label: string
  value: string
  detail: string
  positive?: boolean
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className={`mt-1 text-sm ${positive ? 'text-gain' : 'text-slate-500'}`}>{detail}</p>
        </div>
        <div className="rounded-2xl bg-brand/10 p-2 text-brand">{icon}</div>
      </div>
    </Card>
  )
}
