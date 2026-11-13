import { useMemo, useState } from 'react'
import { Calculator, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks.ts'
import { Logo } from '../brand/Logo.tsx'
import { SiteFooter } from '../layout/SiteFooter.tsx'
import { formatInrCompact } from '../../lib/format.ts'
import {
  AwarenessMarquee,
  BentoProducts,
  DarkTerminalStack,
  FamilySection,
  GrowwHeroCenter,
  LandingIndexTicker,
  LandingLanguageBand,
  SipSipSection,
  TestimonialsSection,
  TradingSimpleSection,
} from './GrowwLandingSections.tsx'

type GrowwHomeProps = {
  enter: string
}

function LandingHeader({ enter }: { enter: string }) {
  const user = useAppSelector((state) => state.auth.user)
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center gap-4 px-4 lg:gap-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Products">
          <Link to={enter} className="landing-nav-link">
            Stocks
          </Link>
          <Link to={user ? '/app/fo/explore' : '/login'} className="landing-nav-link">
            F&amp;O
          </Link>
          <Link to={user ? '/app/funds/explore' : '/login'} className="landing-nav-link">
            Mutual Funds
          </Link>
          <Link to={user ? '/app/market' : '/login'} className="landing-nav-link">
            More
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            to={enter}
            className="landing-search hidden h-11 max-w-[280px] flex-1 items-center gap-2.5 px-4 text-sm text-slate-500 sm:flex lg:max-w-sm"
          >
            <Search size={17} className="shrink-0 text-slate-400" />
            <span className="flex-1 truncate text-left">Search Unnati…</span>
            <kbd className="hidden rounded-md border border-slate-200/80 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 lg:inline">
              Ctrl+K
            </kbd>
          </Link>
          <Link
            to={user ? '/app/stocks/explore' : '/login'}
            className="landing-cta px-5 py-2.5 text-sm font-bold text-white"
          >
            {user ? 'Open app' : 'Login / Sign up'}
          </Link>
        </div>
      </div>
      <LandingIndexTicker />
    </header>
  )
}

function SipTeaser({ enter }: { enter: string }) {
  const [monthly, setMonthly] = useState(5000)
  const [years, setYears] = useState(10)
  const rate = 12

  const future = useMemo(() => {
    const installments = years * 12
    const monthlyRate = rate / 12 / 100
    const invested = monthly * installments
    if (monthlyRate === 0) return { invested, future: invested, gain: 0 }
    const fv = monthly * ((Math.pow(1 + monthlyRate, installments) - 1) / monthlyRate) * (1 + monthlyRate)
    return { invested, future: fv, gain: fv - invested }
  }, [monthly, years])

  return (
    <section className="bg-gradient-to-b from-white to-slate-50/50 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gain">Planning</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Estimate wealth with SIP</h2>
          <p className="mt-3 text-slate-600">Drag the sliders — numbers update instantly, like Groww&apos;s calculator (sample 12% return).</p>
          <label className="mt-8 block">
            <span className="text-sm font-medium text-slate-700">Monthly SIP (₹)</span>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-gain"
            />
            <span className="mt-1 block text-right text-sm font-semibold tabular-nums text-gain">₹{monthly.toLocaleString('en-IN')}</span>
          </label>
          <label className="mt-6 block">
            <span className="text-sm font-medium text-slate-700">Time period (years)</span>
            <input
              type="range"
              min={1}
              max={30}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-gain"
            />
            <span className="mt-1 block text-right text-sm font-semibold tabular-nums text-gain">{years} years</span>
          </label>
        </div>
        <div className="landing-panel p-6 lg:p-9">
          <p className="text-sm font-medium text-slate-500">Estimated corpus</p>
          <p className="mt-2 bg-gradient-to-br from-slate-900 to-brand bg-clip-text text-4xl font-bold tabular-nums text-transparent md:text-5xl">
            {formatInrCompact(future.future)}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Invested {formatInrCompact(future.invested)} · Gains{' '}
            <span className="font-medium text-gain">{formatInrCompact(future.gain)}</span>
          </p>
          <Link
            to={enter === '/login' ? '/login' : '/app/calculators'}
            className="landing-cta mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white"
          >
            <Calculator size={18} />
            Full calculator
          </Link>
        </div>
      </div>
    </section>
  )
}

export function GrowwHome({ enter }: GrowwHomeProps) {
  return (
    <div className="landing-page min-h-screen bg-white text-slate-900">
      <LandingHeader enter={enter} />
      <main>
        <GrowwHeroCenter enter={enter} />
        <BentoProducts enter={enter} />
        <SipSipSection enter={enter} />
        <SipTeaser enter={enter} />
        <DarkTerminalStack enter={enter} />
        <TradingSimpleSection enter={enter} />
        <TestimonialsSection />
        <FamilySection />
        <LandingLanguageBand />
      </main>
      <AwarenessMarquee />
      <SiteFooter />
    </div>
  )
}
