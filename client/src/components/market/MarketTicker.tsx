import { Link } from 'react-router-dom'
import { sampleIndices } from '../../data/sampleMarket.ts'

function TickerItem({ item }: { item: (typeof sampleIndices)[number] }) {
  const up = item.pct >= 0
  return (
    <Link
      to={`/app/instruments/${item.id}`}
      className="group inline-flex shrink-0 items-center gap-2.5 border-r border-line/70 px-5 py-1 text-[11px] transition last:border-r-0 hover:bg-accent/5"
    >
      <span className="font-semibold uppercase tracking-wide text-ink/70 group-hover:text-brand">{item.name}</span>
      <span className="font-semibold tabular-nums text-ink">{item.value}</span>
      <span className={`tabular-nums font-medium ${up ? 'text-gain' : 'text-loss'}`}>
        {up ? '+' : ''}
        {item.change.toFixed(2)} ({up ? '+' : ''}
        {item.pct.toFixed(2)}%)
      </span>
    </Link>
  )
}

function TickerStrip({ idPrefix = '' }: { idPrefix?: string }) {
  return (
    <>
      {sampleIndices.map((item) => (
        <TickerItem key={`${idPrefix}${item.id}`} item={item} />
      ))}
    </>
  )
}

export function MarketTicker({ paused = false }: { paused?: boolean }) {
  return (
    <div className={`border-b border-slate-200/80 bg-white px-4 py-2 ${paused ? 'pointer-events-none' : ''}`}>
      <div className="mx-auto max-w-6xl">
        <div
          className="flex w-full overflow-hidden rounded-lg border border-slate-200/90 bg-white"
          aria-label="Sample index ticker"
        >
          <div className="flex shrink-0 items-center border-r border-slate-200 px-3 text-[10px] font-medium text-slate-500">
            Sample · not live
          </div>
          <div className="ticker-shell min-w-0 flex-1 py-1.5">
            <div className="ticker-track" style={paused ? { animationPlayState: 'paused' } : undefined}>
              <div className="ticker-set">
                <TickerStrip />
              </div>
              <div className="ticker-set" aria-hidden>
                <TickerStrip idPrefix="dup-" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
