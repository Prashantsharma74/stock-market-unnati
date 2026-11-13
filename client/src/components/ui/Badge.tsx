import type { ReactNode } from 'react'

const tones = {
  neutral: 'bg-slate-100 text-slate-700',
  simulated: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  positive: 'bg-gain/10 text-gain',
  warning: 'bg-amber-50 text-amber-800',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]}`}>{children}</span>
}
