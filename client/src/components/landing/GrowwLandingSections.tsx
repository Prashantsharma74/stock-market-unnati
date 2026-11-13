import { Link } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import { sampleIndices } from '../../data/sampleMarket.ts'
import { LanguageBand } from './LanguageBand.tsx'

function TickerPill({ item }: { item: (typeof sampleIndices)[number] }) {
  const up = item.pct >= 0
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 px-5 text-[13px] text-slate-600">
      <span className="font-medium text-slate-500">{item.name}</span>
      <span className="tabular-nums font-semibold text-slate-800">{item.value}</span>
      <span className={`inline-flex items-center gap-0.5 tabular-nums font-semibold ${up ? 'text-gain' : 'text-loss'}`}>
        <span aria-hidden>{up ? '↑' : '↓'}</span>
        {Math.abs(item.pct).toFixed(2)}%
      </span>
    </span>
  )
}

export function LandingIndexTicker() {
  return (
    <div className="border-b border-slate-100 bg-white/80">
      <div className="ticker-shell py-2.5">
        <div className="ticker-track items-center">
          <span className="ticker-set flex items-center">
            {sampleIndices.map((item) => (
              <span key={item.id} className="inline-flex items-center">
                <TickerPill item={item} />
                <span className="landing-index-dot" aria-hidden />
              </span>
            ))}
          </span>
          <span className="ticker-set flex items-center" aria-hidden>
            {sampleIndices.map((item) => (
              <span key={`${item.id}-d`} className="inline-flex items-center">
                <TickerPill item={item} />
                <span className="landing-index-dot" />
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  )
}

export function GrowwHeroCenter({ enter }: { enter: string }) {
  return (
    <section className="landing-hero-glow px-4 pb-14 pt-12 text-center md:pb-20 md:pt-16">
      <p className="animate-rise text-xs font-medium tracking-wide text-slate-500">
        Demo workspace · optional live quotes
      </p>
      <h1 className="animate-rise mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-[3.5rem] md:leading-[1.08]">
        Unnati your wealth
      </h1>
      <p className="animate-rise mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600">
        Clean investing UI for stocks, funds, and tools — learn without placing real orders.
      </p>
      <Link to={enter} className="landing-cta animate-rise mt-8 inline-flex px-9 py-3.5 text-sm font-semibold text-white">
        Get started
      </Link>
      <div className="landing-hero-art animate-float mx-auto mt-12 max-w-5xl">
        <IsometricHeroIllustration className="h-auto w-full" />
      </div>
    </section>
  )
}

function IsometricHeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 960 380" className={className} aria-hidden role="img">
      <defs>
        <linearGradient id="heroSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef9f4" />
          <stop offset="45%" stopColor="#f4f7fb" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="towerA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2ecc9a" />
          <stop offset="100%" stopColor="#1a7a4c" />
        </linearGradient>
        <linearGradient id="towerB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a5fc7" />
          <stop offset="100%" stopColor="#2a3d78" />
        </linearGradient>
        <filter id="heroShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
      </defs>
      <rect width="960" height="380" fill="url(#heroSky)" />
      <ellipse cx="480" cy="300" rx="420" ry="60" fill="#e2e8f0" opacity="0.35" />
      <path d="M60 268 Q480 248 900 268" stroke="#cbd5e1" strokeWidth="2" fill="none" />
      <g filter="url(#heroShadow)">
        <path d="M140 268 L200 248 L260 268 L260 320 L140 320 Z" fill="url(#towerA)" />
        <rect x="168" y="200" width="64" height="68" rx="4" fill="url(#towerA)" opacity="0.92" />
        <path d="M300 268 L380 238 L460 268 L460 320 L300 320 Z" fill="url(#towerB)" />
        <rect x="340" y="160" width="80" height="108" rx="3" fill="url(#towerB)" />
        <rect x="520" y="210" width="56" height="110" rx="3" fill="#94a3b8" />
        <path d="M640 268 L720 250 L800 268 L800 320 L640 320 Z" fill="url(#towerA)" opacity="0.85" />
        <rect x="680" y="175" width="72" height="93" rx="3" fill="#1a7a4c" />
      </g>
      <circle cx="220" cy="285" r="14" fill="#1a7a4c" opacity="0.25" />
      <circle cx="560" cy="292" r="11" fill="#2a3d78" opacity="0.2" />
      <rect x="380" y="278" width="36" height="14" rx="7" fill="#64748b" opacity="0.35" />
      <rect x="460" y="282" width="28" height="10" rx="5" fill="#64748b" opacity="0.3" />
    </svg>
  )
}

export function BentoProducts({ enter }: { enter: string }) {
  return (
    <section className="bg-white px-4 py-20 md:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
          <Sparkles size={14} className="text-gain" aria-hidden />
          Built for clarity · sample metrics only
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-[2.75rem] md:leading-tight">
          India&apos;s markets at your fingertips
        </h2>
        <div className="landing-stagger mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto] lg:gap-5">
          <Link
            to={enter}
            className="landing-bento group flex flex-col bg-gradient-to-b from-slate-50/80 to-white p-6 text-left lg:row-span-2"
          >
            <h3 className="text-xl font-bold text-slate-900">Stocks</h3>
            <div className="flex flex-1 flex-col items-center justify-center py-6">
              <MiniPhoneChart />
            </div>
            <p className="text-sm leading-relaxed text-slate-500 group-hover:text-slate-600">
              Live explore tiles when your API key and plan allow it.
            </p>
          </Link>
          <Link to={enter} className="landing-bento p-6 text-left">
            <h3 className="text-lg font-bold text-slate-900">ETFs</h3>
            <p className="mt-1 text-xs text-slate-500">Gold, Silver, Index &amp; more</p>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {[
                { t: 'Au', c: 'bg-amber-100 text-amber-800' },
                { t: 'N50', c: 'bg-brand/10 text-brand' },
                { t: 'US', c: 'bg-sky-100 text-sky-800' },
                { t: '₹', c: 'bg-emerald-100 text-emerald-800' },
              ].map(({ t, c }) => (
                <span key={t} className={`grid aspect-square place-items-center rounded-xl text-xs font-bold ${c}`}>
                  {t}
                </span>
              ))}
            </div>
          </Link>
          <Link to={enter} className="landing-bento flex flex-col p-6 text-left lg:row-span-2">
            <h3 className="text-lg font-bold text-slate-900">IPOs</h3>
            <p className="mt-1 text-xs text-slate-500">Open · Applied · Upcoming</p>
            <ul className="mt-5 space-y-2.5">
              {[
                { name: 'Arowana Health Tech', tag: 'Last day', hot: true },
                { name: 'Orbit Power Ltd', tag: 'Closes in 24h', hot: false },
              ].map((row) => (
                <li
                  key={row.name}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[10px] font-bold text-brand shadow-sm">
                    {row.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 text-left text-xs font-medium text-slate-800">{row.name}</span>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold ${row.hot ? 'bg-gain/15 text-gain' : 'bg-slate-200/80 text-slate-600'}`}
                  >
                    {row.hot ? 'Apply' : row.tag}
                  </span>
                </li>
              ))}
            </ul>
          </Link>
          <div className="landing-bento relative overflow-hidden p-6 text-left">
            <div className="landing-bond-pattern pointer-events-none absolute inset-0" aria-hidden />
            <h3 className="relative text-lg font-bold text-slate-900">Bonds</h3>
            <p className="relative mt-1 text-xs text-slate-500">Fixed interest · regular payouts</p>
            <p className="relative mt-10 flex justify-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-slate-200 bg-white text-2xl font-semibold text-slate-400 shadow-sm">
                ₹
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function MiniPhoneChart() {
  const tabs = ['1D', '1W', '1M', '1Y']
  return (
    <div className="w-[11.5rem] rounded-[1.25rem] border border-slate-200/90 bg-white p-3 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] transition group-hover:scale-[1.02]">
      <p className="text-[10px] font-semibold text-slate-500">Renewable Energy</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-slate-900">₹792.52</p>
      <p className="text-[11px] font-semibold text-gain">+9.12 (1.17%)</p>
      <svg viewBox="0 0 160 56" className="mt-2 h-14 w-full">
        <defs>
          <linearGradient id="landingChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a7a4c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1a7a4c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="landing-chart-area"
          d="M0,48 L20,42 L40,44 L60,32 L80,34 L100,22 L120,18 L140,12 L160,8 L160,56 L0,56 Z"
        />
        <polyline
          fill="none"
          stroke="#1a7a4c"
          strokeWidth="2.5"
          strokeLinecap="round"
          points="0,48 20,42 40,44 60,32 80,34 100,22 120,18 140,12 160,8"
        />
      </svg>
      <div className="mt-2 flex justify-center gap-1">
        {tabs.map((t, i) => (
          <span
            key={t}
            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${i === 2 ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

export function SipSipSection({ enter }: { enter: string }) {
  const periods = ['1M', '6M', '1Y', '3Y', '5Y', 'All']
  return (
    <section className="relative overflow-hidden border-y border-slate-100 bg-white py-20 md:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(#e8eaef 1px, transparent 1px), linear-gradient(90deg, #e8eaef 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Build wealth, SIP by SIP</h2>
        <p className="mt-3 text-slate-600">Direct mutual funds · sample fund preview</p>
        <Link
          to={enter}
          className="mt-5 inline-flex rounded-full border border-slate-200 bg-white px-7 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-gain hover:text-gain"
        >
          Invest now
        </Link>
        <div className="landing-panel mx-auto mt-14 max-w-md p-6 text-left">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-white shadow-md">
              IF
            </span>
            <div>
              <p className="font-bold text-slate-900">India Hybrid Fund</p>
              <p className="mt-0.5 text-xs text-slate-500">Medium risk · Hybrid · Large cap</p>
            </div>
          </div>
          <p className="mt-5 text-3xl font-bold tabular-nums text-gain">16.32%</p>
          <p className="text-xs font-medium text-slate-500">3Y annualised (sample)</p>
          <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-b from-gain/10 to-transparent p-2">
            <svg viewBox="0 0 240 64" className="h-16 w-full">
              <polyline
                fill="none"
                stroke="#1a7a4c"
                strokeWidth="2.5"
                strokeLinecap="round"
                points="0,52 40,46 80,40 120,32 160,22 200,14 240,8"
              />
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {periods.map((p) => (
              <span
                key={p}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${p === '3Y' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              >
                {p}
              </span>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <span className="rounded-xl border border-slate-200 py-2.5 text-center text-xs font-semibold text-slate-700">
              One-time
            </span>
            <span className="landing-cta py-2.5 text-center text-xs font-bold text-white">Start SIP</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function DarkTerminalStack({ enter }: { enter: string }) {
  const blocks = [
    {
      title: 'Track charts, positions, and trade in a customisable layout',
      cta: 'Explore Terminal',
      to: '/app/market',
      glow: '',
    },
    {
      title: 'Analyse chains, view payoffs, create baskets',
      cta: 'Option Chain',
      to: '/app/fo/explore',
      muted: true,
      glow: 'landing-dark-glow--gold',
    },
    {
      title: 'One-tap trade with Scalper mode on mobile',
      cta: 'Explore Scalper mode',
      to: '/app/fo/explore',
      glow: '',
    },
    {
      title: 'Trade commodities like Gold, Silver, and more',
      cta: 'Explore Commodities',
      to: '/app/fo/explore',
      glow: 'landing-dark-glow--gold',
    },
  ]
  return (
    <section className="bg-[#030508] text-white">
      {blocks.map((block) => (
        <div
          key={block.title}
          className={`landing-dark-glow ${block.glow} border-b border-white/[0.07] px-4 py-20 md:py-28 ${'muted' in block && block.muted ? 'opacity-75' : ''}`}
        >
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-2xl font-bold leading-snug tracking-tight md:text-[2rem]">{block.title}</h2>
              <Link
                to={enter === '/login' ? '/login' : block.to}
                className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-slate-100"
              >
                {block.cta}
                <ChevronRight size={18} strokeWidth={2.5} />
              </Link>
            </div>
            <TerminalMock variant={block.muted ? 'chain' : 'terminal'} />
          </div>
        </div>
      ))}
    </section>
  )
}

function TerminalMock({ variant }: { variant: 'terminal' | 'chain' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#141a22] to-[#0a0e13] p-4 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
        <span className="text-gain">NIFTY 50</span>
        <span className="text-loss">BANKNIFTY</span>
        <span className="text-slate-500">Layout</span>
      </div>
      <svg viewBox="0 0 400 140" className="mt-3 h-32 w-full">
        <defs>
          <pattern id="termGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" strokeOpacity="0.06" />
          </pattern>
        </defs>
        <rect width="400" height="140" fill="url(#termGrid)" />
        {variant === 'terminal'
          ? [18, 35, 28, 52, 44, 68, 58, 82, 72, 95].map((h, i) => (
              <rect
                key={i}
                x={12 + i * 38}
                y={130 - h}
                width="20"
                height={h}
                fill={i % 2 ? '#1a7a4c' : '#c44838'}
                rx="2"
                opacity="0.9"
              />
            ))
          : (
              <polyline
                fill="none"
                stroke="#e08a2a"
                strokeWidth="2"
                points="0,100 50,85 100,90 150,60 200,70 250,40 300,50 350,25 400,30"
              />
            )}
      </svg>
      {variant === 'terminal' ? (
        <p className="mt-2 text-right text-sm font-bold tabular-nums text-gain">+ ₹3,23,568.00</p>
      ) : (
        <div className="mt-2 flex gap-2 text-[10px] text-slate-400">
          <span className="rounded bg-white/10 px-2 py-1">Analyze</span>
          <span className="rounded bg-white/10 px-2 py-1">Exit</span>
        </div>
      )}
    </div>
  )
}

export function TradingSimpleSection({ enter }: { enter: string }) {
  const cards = [
    { title: 'Monitor top intraday stocks in real time', link: 'Explore Intraday', bg: 'from-[#5b6ee8] to-[#4658d4]' },
    { title: 'Upto 4x leverage with MTF (demo)', link: 'Explore MTF', bg: 'from-[#a3b360] to-[#8a9a4a]' },
    { title: 'Pledge: unlock margin from your holdings', link: 'Explore Pledge', bg: 'from-gain to-[#156b40]' },
  ]
  return (
    <section className="bg-black px-4 py-20 text-white md:py-28">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-3xl font-bold tracking-tight md:text-[2.75rem] md:leading-tight">Stock trading made simple</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
            Fast layouts, crisp typography, and mobile-first patterns — still a sandbox with no real trades.
          </p>
        </div>
        <div className="space-y-10">
          {cards.map((card) => (
            <article key={card.title}>
              <div className={`rounded-[1.75rem] bg-gradient-to-br ${card.bg} p-8 shadow-2xl`}>
                <PhoneFeatureMock />
              </div>
              <h3 className="mt-5 text-xl font-bold leading-snug">{card.title}</h3>
              <Link
                to={enter}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#5ddea8] transition hover:text-white"
              >
                {card.link}
                <ChevronRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function PhoneFeatureMock() {
  return (
    <div className="landing-phone mx-auto w-[9.5rem] p-1.5">
      <div className="overflow-hidden rounded-[1rem] bg-[#12151a]">
        <div className="bg-gain/20 px-2 py-1 text-[8px] font-bold text-gain">Watchlist</div>
        <ul className="space-y-1 p-2">
          {['RELI', 'TCS', 'INFY'].map((s, i) => (
            <li key={s} className="flex justify-between text-[8px] text-slate-300">
              <span>{s}</span>
              <span className={i !== 1 ? 'text-gain' : 'text-loss'}>+0.{i}%</span>
            </li>
          ))}
        </ul>
        <svg viewBox="0 0 120 40" className="h-10 w-full opacity-90">
          <polyline fill="none" stroke="#1a7a4c" strokeWidth="2" points="0,32 30,28 60,30 90,18 120,12" />
        </svg>
      </div>
    </div>
  )
}

const TESTIMONIAL_LAYOUT: { top?: string; left?: string; right?: string; bottom?: string; tilt: string }[] = [
  { top: '8%', left: '4%', tilt: '-2deg' },
  { top: '12%', right: '6%', tilt: '3deg' },
  { top: '42%', left: '0%', tilt: '1.5deg' },
  { top: '38%', right: '2%', tilt: '-2.5deg' },
  { bottom: '10%', left: '8%', tilt: '2deg' },
  { bottom: '14%', right: '10%', tilt: '-1deg' },
]

export function TestimonialsSection() {
  const quotes = [
    { text: 'Your support team has been quite helpful in answering my queries.', name: 'Sangeeta M.', role: 'Demo user' },
    { text: 'I started exploring because the UI was this clear.', name: 'Abhinav S.', role: 'Developer' },
    { text: 'SIP calculator helped me understand compounding.', name: 'Sahil B.', role: 'Analyst' },
    { text: 'Market feed labels what is live vs sample.', name: 'Ankit P.', role: 'PM' },
    { text: 'Watchlist is easy for simulated names.', name: 'Priya K.', role: 'Designer' },
    { text: 'Unnati is a sandbox — that honesty helps.', name: 'Rohit D.', role: 'Student' },
  ]
  return (
    <section className="overflow-hidden bg-gradient-to-b from-white to-slate-50/80 px-4 py-20 md:py-28">
      <div className="relative mx-auto hidden min-h-[540px] max-w-6xl lg:block">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Trusted by learners on Unnati</h2>
            <p className="mt-2 text-sm text-slate-500">Fictional quotes · layout preview only</p>
          </div>
        </div>
        {quotes.map((q, i) => (
          <blockquote
            key={q.name}
            style={{ ...TESTIMONIAL_LAYOUT[i], ['--quote-tilt' as string]: TESTIMONIAL_LAYOUT[i].tilt }}
            className="landing-quote absolute z-[1] max-w-[240px] p-4 text-sm"
          >
            <p className="leading-relaxed text-slate-600">&ldquo;{q.text}&rdquo;</p>
            <footer className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-100 text-xs font-bold text-slate-700">
                {q.name[0]}
              </span>
              <div>
                <p className="font-bold text-slate-900">{q.name}</p>
                <p className="text-xs text-slate-500">{q.role}</p>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
      <div className="mx-auto max-w-6xl lg:hidden">
        <h2 className="text-center text-2xl font-bold text-slate-900">Trusted by learners on Unnati</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {quotes.map((q) => (
            <blockquote key={q.name} className="landing-quote p-4 text-sm">
              <p className="text-slate-600">&ldquo;{q.text}&rdquo;</p>
              <footer className="mt-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-bold">{q.name[0]}</span>
                <div>
                  <p className="font-semibold">{q.name}</p>
                  <p className="text-xs text-slate-500">{q.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FamilySection() {
  const items = [
    { label: '915', grad: 'from-emerald-950 via-green-900 to-teal-950', pattern: 'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)' },
    { label: 'W', grad: 'from-amber-950 via-yellow-900/90 to-amber-950', pattern: 'radial-gradient(circle, rgba(255,215,0,0.08) 1px, transparent 1px)' },
    { label: 'Credit', grad: 'from-slate-900 via-slate-800 to-zinc-900', pattern: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)' },
  ]
  return (
    <section className="bg-[#050608] px-4 py-20 text-center text-white md:py-24">
      <h2 className="text-2xl font-bold md:text-3xl">More from the Unnati family</h2>
      <p className="mt-2 text-sm text-slate-400">Placeholder brands · not affiliated products</p>
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`relative flex h-52 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${item.grad} text-3xl font-bold shadow-xl`}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage: item.pattern,
                backgroundSize: item.label === 'W' ? '24px 24px' : '12px 12px',
              }}
              aria-hidden
            />
            <span className="relative bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent drop-shadow-sm">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function AwarenessMarquee() {
  const items = [
    'Unnati is a demonstration workspace — not a broker',
    'Sample prices are not exchange quotes',
    'Do not share API keys in the client',
    'Check Infoway plan before expecting live data',
    'Investor education only — no order placement',
  ]
  const chunk = items.join('   ✦   ')
  return (
    <section className="border-t border-slate-200 bg-slate-50/90 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4">
        <span className="shrink-0 rounded-md bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
          Investor awareness
        </span>
        <div className="ticker-shell min-w-0 flex-1">
          <div className="ticker-track">
            <span className="ticker-set px-6 normal-case tracking-normal">{chunk}</span>
            <span className="ticker-set px-6 normal-case tracking-normal" aria-hidden>
              {chunk}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LandingLanguageBand() {
  return <LanguageBand />
}
