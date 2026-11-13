import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { useToast } from '../ui/useToast.ts'

const SCROLL_PX_PER_MS = 0.045
const MAX_ROTATE_Y = 52

const SCRIPT_FONT =
  '"Nirmala UI", "Noto Sans Telugu", "Noto Sans Malayalam", "Noto Sans Gujarati", "Noto Sans Kannada", "Noto Sans Bengali", "Noto Sans Devanagari", "Noto Sans Tamil", sans-serif'

const COPIES = [0, 1]

type BandCard = {
  id: string
  label: string
  lang: string
  background: string
  ink: string
  tilt: number
  Art: () => ReactNode
  script?: string
  scriptSize?: string
}

const cards: BandCard[] = [
  { id: 'sip', label: 'Sample SIP', lang: 'en', background: '#f2efe8', ink: '#2a3d78', tilt: -3, Art: SipArt },
  { id: 'kn', label: 'Kannada', script: 'ಕನ್ನಡ', lang: 'kn', background: '#d9e8f5', ink: '#2a3d78', tilt: -5, scriptSize: '1.72rem', Art: KannadaArt },
  { id: 'bn', label: 'Bengali', script: 'বাংলা', lang: 'bn', background: '#f5f0e0', ink: '#1a7a4c', tilt: 4, scriptSize: '1.78rem', Art: BengaliArt },
  { id: 'te', label: 'Telugu', script: 'తెలుగు', lang: 'te', background: '#ebe4f7', ink: '#2a3d78', tilt: -4, scriptSize: '1.72rem', Art: TeluguArt },
  { id: 'ml', label: 'Malayalam', script: 'മലയാളം', lang: 'ml', background: '#e3f3ea', ink: '#1a7a4c', tilt: 3.5, scriptSize: '1.3rem', Art: MalayalamArt },
  { id: 'gu', label: 'Gujarati', script: 'ગુજરાતી', lang: 'gu', background: '#fae8d8', ink: '#b86a16', tilt: -3, scriptSize: '1.34rem', Art: GujaratiArt },
  { id: 'hi', label: 'Hindi', script: 'हिन्दी', lang: 'hi', background: '#f8e8df', ink: '#b86a16', tilt: 3, scriptSize: '1.62rem', Art: HindiArt },
  { id: 'ta', label: 'Tamil', script: 'தமிழ்', lang: 'ta', background: '#e4ecf9', ink: '#2a3d78', tilt: -4.5, scriptSize: '1.72rem', Art: TamilArt },
  { id: 'mr', label: 'Marathi', script: 'मराठी', lang: 'mr', background: '#f6f0e6', ink: '#1b1914', tilt: 5, scriptSize: '1.58rem', Art: MarathiArt },
  { id: 'markets', label: 'Sample markets', lang: 'en', background: '#1c2c5a', ink: '#e08a2a', tilt: -2.5, Art: MarketArt },
  { id: 'funds', label: 'Mutual funds', lang: 'en', background: '#16181f', ink: '#f4efe6', tilt: 3.5, Art: FundArt },
]

export function LanguageBand() {
  const toast = useToast()

  return (
    <section
      id="languages"
      aria-labelledby="language-band-title"
      className="language-band-section overflow-x-clip pt-12 pb-4 sm:pt-16 sm:pb-6"
    >
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2
          id="language-band-title"
          className="text-balance font-display text-[2rem] font-semibold leading-[1.12] tracking-tight text-slate-900 sm:text-[2.75rem]"
        >
          Finance simplified, in your language
        </h2>
        <p className="sr-only">Regional scripts and sample learning cards — demo content only.</p>
        <button
          type="button"
          onClick={() => toast('Language videos are not published yet.')}
          className="language-watch mt-6 inline-flex items-center gap-2.5 py-1.5 pr-4 pl-1.5 text-sm font-semibold text-slate-800"
        >
          <span className="language-watch-icon grid h-7 w-7 place-items-center rounded-full text-white">
            <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3" aria-hidden="true">
              <path d="M3.1 1.7v8.6L10.2 6 3.1 1.7z" fill="currentColor" />
            </svg>
          </span>
          Watch
        </button>
        <p className="sr-only">Language videos are not published.</p>
      </div>

      <LanguageCoverflowCarousel />
    </section>
  )
}

function LanguageCoverflowCarousel() {
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const pausedRef = useRef(false)
  const loopWidthRef = useRef(0)
  const lastTsRef = useRef<number | null>(null)
  const reduceMotionRef = useRef(false)

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    const track = trackRef.current
    if (!stage || !track) return

    const measureLoop = () => {
      const firstSet = track.querySelector<HTMLElement>('[data-language-set="0"]')
      if (firstSet) loopWidthRef.current = firstSet.getBoundingClientRect().width
    }

    measureLoop()
    const ro = new ResizeObserver(measureLoop)
    ro.observe(track)

    let frame = 0
    const applyCoverflow = () => {
      const stageRect = stage.getBoundingClientRect()
      const centerX = stageRect.left + stageRect.width / 2
      const spread = Math.max(stageRect.width * 0.36, 280)

      track.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
        const rect = card.getBoundingClientRect()
        const cardCenter = rect.left + rect.width / 2
        const delta = cardCenter - centerX
        const norm = Math.max(-1, Math.min(1, delta / spread))
        const ry = -norm * MAX_ROTATE_Y
        const abs = Math.abs(norm)
        const scale = 1 - abs * 0.26
        const arcY = abs * abs * 22
        const tilt = card.dataset.tilt ?? '0'

        card.style.transform = `rotateY(${ry.toFixed(2)}deg) rotate(${tilt}deg) scale(${scale.toFixed(3)}) translateY(${arcY.toFixed(1)}px)`
        card.style.zIndex = String(Math.round((1 - abs) * 120))
      })
    }

    const tick = (ts: number) => {
      const last = lastTsRef.current
      lastTsRef.current = ts
      const dt = last === null ? 0 : ts - last

      if (!pausedRef.current && !reduceMotionRef.current && loopWidthRef.current > 0 && dt > 0) {
        offsetRef.current += dt * SCROLL_PX_PER_MS
        while (offsetRef.current >= loopWidthRef.current) {
          offsetRef.current -= loopWidthRef.current
        }
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
      }

      applyCoverflow()
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [])

  return (
    <div
      ref={stageRef}
      className="language-stage"
      role="region"
      aria-label="Languages and sample topics"
      onMouseEnter={() => {
        pausedRef.current = true
      }}
      onMouseLeave={() => {
        pausedRef.current = false
      }}
      onFocus={() => {
        pausedRef.current = true
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) pausedRef.current = false
      }}
    >
      <div className="language-row">
        <div ref={trackRef} className="language-track language-track--js">
          {COPIES.map((copy) => (
            <div
              key={copy}
              data-language-set={copy}
              className="language-set"
              data-copy={copy}
              aria-hidden={copy > 0 ? true : undefined}
            >
              {cards.map((card) => (
                <BandCardView key={`${copy}-${card.id}`} card={card} coverflow />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BandCardView({ card, coverflow = false }: { card: BandCard; coverflow?: boolean }) {
  const style = {
    backgroundColor: card.background,
    color: card.ink,
  } as CSSProperties

  return (
    <article
      data-card
      data-tilt={card.tilt}
      lang={card.lang}
      className={`language-card relative h-[236px] w-[162px] shrink-0 overflow-hidden rounded-[1.35rem] border border-black/[0.06] shadow-[0_20px_44px_-28px_rgba(15,23,42,0.45)] sm:h-[268px] sm:w-[192px] ${coverflow ? 'language-card--coverflow' : ''}`}
      style={style}
    >
      <div className="relative z-10 px-4 pt-4">
        {card.script ? (
          <>
            <p className="sr-only">{card.label}</p>
            <p
              className="whitespace-nowrap leading-none font-bold tracking-tight"
              style={{ fontFamily: SCRIPT_FONT, fontSize: card.scriptSize ?? '1.5rem' }}
            >
              {card.script}
            </p>
          </>
        ) : (
          <p className="max-w-[9rem] text-left text-[1.22rem] leading-[1.15] font-bold tracking-tight text-balance sm:max-w-[10rem] sm:text-[1.35rem]">
            {card.label}
          </p>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[152px] sm:h-[172px]">
        <card.Art />
      </div>
    </article>
  )
}

function ArtFrame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 176 158" className="h-full w-full" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      {children}
    </svg>
  )
}

function TeluguArt() {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <ArtFrame>
      <ellipse cx="88" cy="146" rx="42" ry="6" fill="#2a3d78" opacity="0.1" />
      <g transform="translate(88 108)">
        {petals.map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-26"
            rx="11"
            ry="22"
            fill={deg % 90 === 0 ? '#2a3d78' : '#7d88b4'}
            opacity={deg % 90 === 0 ? 0.95 : 0.5}
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="13" fill="#f4efe6" />
        <circle r="6.5" fill="#e08a2a" />
      </g>
    </ArtFrame>
  )
}

function MalayalamArt() {
  return (
    <ArtFrame>
      <ellipse cx="88" cy="148" rx="32" ry="5" fill="#1a7a4c" opacity="0.16" />
      <path d="M88 42c7 11 10 18 10 27 0 7-4.5 12-10 12s-10-5-10-12c0-9 3-16 10-27z" fill="#e08a2a" />
      <path d="M88 56c3.5 6 4.5 9 4.5 13 0 3.2-2 5.4-4.5 5.4s-4.5-2.2-4.5-5.4c0-4 1-7 4.5-13z" fill="#f4efe6" />
      <path d="M64 84h48l-7 8H71z" fill="#1a7a4c" />
      <rect x="84" y="92" width="8" height="20" rx="2" fill="#14643f" />
      <path d="M60 112h56l-6 7H66z" fill="#1a7a4c" />
      <path d="M48 120h80c-6 16-22 24-40 24s-34-8-40-24z" fill="#1a7a4c" />
      <path d="M64 128h48c-4 7-13 11-24 11s-20-4-24-11z" fill="#f4efe6" opacity="0.3" />
    </ArtFrame>
  )
}

const BANDHANI_DOTS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].flatMap((row) =>
  [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]
    .filter((col) => Math.abs(row) + Math.abs(col) <= 5)
    .map((col) => {
      const hot = (row + col) % 2 === 0
      return {
        cx: 88 + col * 13,
        cy: 100 + row * 11,
        r: hot ? 4 : 2.15,
        fill: hot ? '#e08a2a' : '#2a3d78',
        opacity: hot ? 0.95 : 0.55,
      }
    }),
)

function GujaratiArt() {
  return (
    <ArtFrame>
      {BANDHANI_DOTS.map((dot) => (
        <circle key={`${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.fill} opacity={dot.opacity} />
      ))}
    </ArtFrame>
  )
}

function KannadaArt() {
  return (
    <ArtFrame>
      <g transform="translate(88 104)" fill="none" stroke="#2a3d78" strokeWidth="3">
        <rect x="-50" y="-50" width="100" height="100" rx="8" opacity="0.22" />
        <rect x="-34" y="-34" width="68" height="68" transform="rotate(45)" />
        <rect x="-18" y="-18" width="36" height="36" rx="2" />
        <circle r="6" fill="#e08a2a" stroke="none" />
      </g>
    </ArtFrame>
  )
}

function BengaliArt() {
  const dots = Array.from({ length: 14 }, (_, index) => {
    const angle = (index / 14) * Math.PI * 2 - Math.PI / 2
    return { cx: 88 + Math.cos(angle) * 38, cy: 106 + Math.sin(angle) * 38, index }
  })
  return (
    <ArtFrame>
      <g fill="none" stroke="#1a7a4c" strokeWidth="2.4">
        <circle cx="88" cy="106" r="54" opacity="0.25" />
        <circle cx="88" cy="106" r="34" />
        <circle cx="88" cy="106" r="15" fill="#1a7a4c" stroke="none" opacity="0.14" />
      </g>
      {dots.map((dot) => (
        <circle key={dot.index} cx={dot.cx} cy={dot.cy} r={dot.index % 2 ? 2.3 : 3.3} fill={dot.index % 2 ? '#1a7a4c' : '#e08a2a'} />
      ))}
    </ArtFrame>
  )
}

function HindiArt() {
  return (
    <ArtFrame>
      <ellipse cx="88" cy="140" rx="50" ry="6" fill="#e08a2a" opacity="0.18" />
      <path d="M88 46c9 14 13 24 13 34 0 8-6 13-13 13s-13-5-13-13c0-10 4-20 13-34z" fill="#e08a2a" />
      <path d="M88 62c4.5 8 6 12 6 17 0 4-2.6 6.5-6 6.5s-6-2.5-6-6.5c0-5 1.5-9 6-17z" fill="#f4efe6" />
      <path d="M34 112c10-24 30-36 54-36s44 12 54 36c-12 8-32 14-54 14s-42-6-54-14z" fill="#2a3d78" />
      <path d="M52 112c8-14 20-20 36-20s28 6 36 20c-10 6-22 9-36 9s-26-3-36-9z" fill="#e08a2a" />
    </ArtFrame>
  )
}

function TamilArt() {
  const dots = [
    [88, 68],
    [62, 98],
    [114, 98],
    [88, 126],
    [88, 98],
  ]
  return (
    <ArtFrame>
      <g fill="none" stroke="#2a3d78" strokeWidth="2.6" strokeLinecap="round">
        <path d="M88 52c20 0 32 14 32 32s-14 34-32 34-32-14-32-34 12-32 32-32z" opacity="0.28" />
        <path d="M58 100c2-22 16-36 30-36" />
        <path d="M118 100c-2-22-16-36-30-36" />
        <path d="M52 112c14 20 28 26 36 26s22-6 36-26" />
        <path d="M68 84c10 12 22 12 40 0" />
        <path d="M70 122c10-8 26-8 36 0" />
      </g>
      {dots.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.2" fill="#e08a2a" />
      ))}
    </ArtFrame>
  )
}

function MarathiArt() {
  return (
    <ArtFrame>
      <rect x="28" y="46" width="120" height="96" rx="12" fill="#2a3d78" opacity="0.06" />
      {Array.from({ length: 6 }, (_, row) => (
        <path
          key={row}
          d={`M34 ${58 + row * 14} l14 -8 14 8 14 -8 14 8 14 -8 14 8 14 -8 14 8`}
          fill="none"
          stroke={row % 2 === 0 ? '#e08a2a' : '#2a3d78'}
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={row % 2 === 0 ? 0.95 : 0.45}
        />
      ))}
    </ArtFrame>
  )
}

const MARKET_BARS = [24, 36, 28, 46, 32, 52]

function MarketArt() {
  return (
    <ArtFrame>
      <rect x="32" y="36" width="112" height="78" rx="10" fill="#10182e" />
      <rect x="40" y="44" width="96" height="54" rx="4" fill="#243460" />
      {MARKET_BARS.map((height, index) => (
        <rect key={height} x={48 + index * 14} y={92 - height} width="8" height={height} rx="2" fill={index === 3 ? '#e08a2a' : '#c5d0ee'} />
      ))}
      <rect x="80" y="116" width="16" height="8" rx="2" fill="#f4efe6" />
      <rect x="62" y="126" width="52" height="6" rx="3" fill="#e08a2a" />
    </ArtFrame>
  )
}

function FundArt() {
  return (
    <ArtFrame>
      <rect x="26" y="126" width="124" height="12" rx="6" fill="#f4efe6" />
      <rect x="36" y="78" width="30" height="48" rx="8" fill="#e08a2a" />
      <rect x="73" y="50" width="30" height="76" rx="8" fill="#f4efe6" />
      <rect x="110" y="90" width="30" height="36" rx="8" fill="#8ea0d4" />
      <rect x="40" y="74" width="22" height="6" rx="3" fill="#b86a16" />
      <rect x="77" y="46" width="22" height="6" rx="3" fill="#e4dccf" />
      <rect x="114" y="86" width="22" height="6" rx="3" fill="#2a3d78" />
    </ArtFrame>
  )
}

function SipArt() {
  const rows = [0, 1, 2, 3]
  return (
    <ArtFrame>
      <rect x="46" y="34" width="84" height="102" rx="12" fill="#2a3d78" />
      <rect x="46" y="34" width="84" height="22" rx="12" fill="#e08a2a" />
      <rect x="46" y="48" width="84" height="10" fill="#e08a2a" />
      <circle cx="64" cy="44" r="3" fill="#f4efe6" />
      <circle cx="112" cy="44" r="3" fill="#f4efe6" />
      {rows.map((row) => (
        <rect
          key={row}
          x="60"
          y={68 + row * 15}
          width={row === 2 ? 56 : 42}
          height="7"
          rx="3.5"
          fill="#f4efe6"
          opacity={row % 2 === 0 ? 0.95 : 0.4}
        />
      ))}
    </ArtFrame>
  )
}
