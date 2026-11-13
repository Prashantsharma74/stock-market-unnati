import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { formatInr, formatInrCompact } from '../../lib/format.ts'

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
  prefix,
  suffix,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  prefix?: string
  suffix?: string
}) {
  const display = suffix
    ? `${value.toLocaleString('en-IN')}${suffix}`
    : prefix
      ? `${prefix}${value.toLocaleString('en-IN')}`
      : value.toLocaleString('en-IN')

  return (
    <div className="rounded-2xl border border-line/80 bg-white p-4 shadow-[0_8px_24px_-20px_rgba(42,61,120,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink">{label}</span>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (!Number.isFinite(next)) return
            onChange(Math.min(max, Math.max(min, next)))
          }}
          className="h-9 w-28 rounded-lg border border-line bg-paper/60 px-2 text-right text-sm font-semibold tabular-nums text-brand outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-accent"
        aria-valuetext={display}
      />
      <div className="mt-1.5 flex justify-between text-[10px] font-medium uppercase tracking-wide text-slate-400">
        <span>{prefix}{min.toLocaleString('en-IN')}{suffix ?? ''}</span>
        <span>{prefix}{max.toLocaleString('en-IN')}{suffix ?? ''}</span>
      </div>
    </div>
  )
}

export function CalculatorPage() {
  const [mode, setMode] = useState<'sip' | 'lumpsum'>('sip')
  const [monthly, setMonthly] = useState(5000)
  const [amount, setAmount] = useState(100000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(10)

  useEffect(() => {
    document.title = 'Calculators · Unnati'
  }, [])

  const result = useMemo(() => {
    if (mode === 'sip') {
      const installments = years * 12
      const monthlyRate = rate / 12 / 100
      const invested = monthly * installments
      const future =
        monthlyRate === 0 ? invested : monthly * ((Math.pow(1 + monthlyRate, installments) - 1) / monthlyRate) * (1 + monthlyRate)
      return { invested, future, gain: future - invested }
    }
    const future = amount * Math.pow(1 + rate / 100, years)
    return { invested: amount, future, gain: future - amount }
  }, [amount, mode, monthly, rate, years])

  const gainShare = result.future > 0 ? Math.round((Math.max(result.gain, 0) / result.future) * 100) : 0

  return (
    <div className="mx-auto max-w-5xl">
      <CalculatorHeader mode={mode} onMode={setMode} />
      <CalculatorBody
        mode={mode}
        monthly={monthly}
        amount={amount}
        rate={rate}
        years={years}
        setMonthly={setMonthly}
        setAmount={setAmount}
        setRate={setRate}
        setYears={setYears}
        result={result}
        gainShare={gainShare}
      />
    </div>
  )
}

function DonutSummary({
  invested,
  gain,
  future,
  gainShare,
}: {
  invested: number
  gain: number
  future: number
  gainShare: number
}) {
  const rounded = Math.round(future)
  const full = formatInr(rounded)
  const compact = formatInrCompact(rounded)
  const useCompact = full.length > 12

  return (
    <div
      className="relative mx-auto h-56 w-full max-w-[15rem]"
      role="img"
      aria-label={`Estimated value ${full}, about ${gainShare} percent estimated gain`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[
              { name: 'Invested', value: invested },
              { name: 'Estimated gain', value: Math.max(gain, 0) },
            ]}
            dataKey="value"
            innerRadius="72%"
            outerRadius="96%"
            stroke="none"
            paddingAngle={2}
          >
            <Cell fill="#e7e1d4" />
            <Cell fill="#e08a2a" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex w-[58%] min-w-0 flex-col items-center justify-center gap-0.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Est. value</p>
          <p className="w-full font-sans text-lg font-bold leading-tight tracking-tight text-ink tabular-nums" title={full}>
            {useCompact ? compact : full}
          </p>
          <p className="text-xs font-medium text-gain">~{gainShare}% gain</p>
        </div>
      </div>
    </div>
  )
}

function CalculatorHeader({ mode, onMode }: { mode: 'sip' | 'lumpsum'; onMode: (m: 'sip' | 'lumpsum') => void }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">Planning tool</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">SIP & lumpsum</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          Estimates only. A higher assumed return does not mean the investment will earn it.
        </p>
      </div>
      <div className="inline-flex rounded-xl bg-white p-1 text-sm font-semibold shadow-sm ring-1 ring-line">
        <button
          type="button"
          className={`rounded-lg px-5 py-2 transition ${mode === 'sip' ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:text-ink'}`}
          onClick={() => onMode('sip')}
        >
          SIP
        </button>
        <button
          type="button"
          className={`rounded-lg px-5 py-2 transition ${mode === 'lumpsum' ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:text-ink'}`}
          onClick={() => onMode('lumpsum')}
        >
          Lumpsum
        </button>
      </div>
    </div>
  )
}

function CalculatorBody({
  mode,
  monthly,
  amount,
  rate,
  years,
  setMonthly,
  setAmount,
  setRate,
  setYears,
  result,
  gainShare,
}: {
  mode: 'sip' | 'lumpsum'
  monthly: number
  amount: number
  rate: number
  years: number
  setMonthly: (v: number) => void
  setAmount: (v: number) => void
  setRate: (v: number) => void
  setYears: (v: number) => void
  result: { invested: number; future: number; gain: number }
  gainShare: number
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_20px_50px_-28px_rgba(42,61,120,0.5)] lg:grid lg:grid-cols-2">
      <div className="space-y-4 bg-gradient-to-br from-paper via-paper/80 to-white p-6 sm:p-8">
        {mode === 'sip' ? (
          <Field label="Monthly investment" prefix="₹" value={monthly} min={500} max={100000} step={500} onChange={setMonthly} />
        ) : (
          <Field label="Investment amount" prefix="₹" value={amount} min={1000} max={10000000} step={1000} onChange={setAmount} />
        )}
        <Field label="Expected annual return" suffix="%" value={rate} min={1} max={30} step={0.5} onChange={setRate} />
        <Field label="Duration (years)" value={years} min={1} max={40} step={1} onChange={setYears} />
        <p className="rounded-xl border border-dashed border-line/90 bg-white/80 px-4 py-3 text-xs leading-5 text-slate-500">
          {mode === 'sip'
            ? 'SIP assumes the same amount every month. It does not model step-up SIPs or market volatility.'
            : 'Lumpsum assumes one deposit at the start and compounding at the chosen rate.'}
        </p>
      </div>

      <div key={mode} className="animate-rise flex flex-col border-t border-line p-6 sm:p-8 lg:border-t-0 lg:border-l">
        <DonutSummary invested={result.invested} gain={result.gain} future={result.future} gainShare={gainShare} />
        <div className="mt-2 flex justify-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e7e1d4]" aria-hidden />
            Invested
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
            Est. gain
          </span>
        </div>
        <dl className="mt-6 space-y-3 rounded-2xl bg-paper/50 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Invested</dt>
            <dd className="font-semibold tabular-nums text-ink">{formatInr(Math.round(result.invested))}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Estimated gain</dt>
            <dd className="font-semibold tabular-nums text-gain">{formatInr(Math.round(result.gain))}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line/80 pt-3">
            <dt className="font-medium text-ink">Estimated value</dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-brand">{formatInr(Math.round(result.future))}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          SIP: FV = P × [((1 + i)^n − 1) / i] × (1 + i). Lumpsum: FV = P × (1 + r)^t. Not guaranteed returns.
        </p>
      </div>
    </div>
  )
}
