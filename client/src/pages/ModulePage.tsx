import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../app/hooks.ts'
import { EmptyState } from '../components/ui/EmptyState.tsx'

const modules = {
  funds: {
    title: 'Mutual fund discovery',
    phase: 'Phase 2',
    summary: 'Search, category filters, fund houses, expense ratios, and NAV history will be built as their own module.',
  },
  calculators: {
    title: 'SIP and lumpsum calculators',
    phase: 'Phase 2',
    summary: 'Interactive calculators with estimated maturity values, clearly marked as not guaranteed, come next.',
  },
  stocks: {
    title: 'Stock tracking',
    phase: 'Phase 3',
    summary: 'A market-data abstraction will replace this sample catalog. Trading will stay unavailable.',
  },
  watchlist: {
    title: 'Your watchlist',
    phase: 'Phase 3',
    summary: 'Adding and removing symbols will be saved per account. The dashboard list is a shared sample.',
  },
  portfolio: {
    title: 'Personal portfolio',
    phase: 'Phase 3',
    summary: 'Demo investments you add yourself, with simulated transactions labelled as such, come after the shared dashboard.',
  },
  learn: {
    title: 'Financial learning',
    phase: 'Phase 2',
    summary: 'Searchable explainers for mutual funds, SIPs, stocks, IPOs, index funds, compounding, and diversification.',
  },
  admin: {
    title: 'Admin dashboard',
    phase: 'Phase 4',
    summary: 'User management, content tools, catalog maintenance, and system health will live here for administrator accounts.',
  },
} as const

export function ModulePage({ moduleKey }: { moduleKey: keyof typeof modules }) {
  const user = useAppSelector((state) => state.auth.user)
  const module = modules[moduleKey]

  useEffect(() => {
    document.title = `${module.title} · Unnati`
  }, [module.title])

  if (moduleKey === 'admin' && user?.role !== 'admin') {
    return (
      <EmptyState
        title="Admins only"
        body="This area is limited to administrator accounts."
        action={
          <Link to="/app" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            Back to dashboard
          </Link>
        }
      />
    )
  }

  return (
    <EmptyState
      title={module.title}
      body={`${module.summary} Scheduled for ${module.phase}. The account tools and sample dashboard in this release are ready.`}
      action={
        <Link to="/app" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">
          Back to dashboard
        </Link>
      }
    />
  )
}
