import type { ReactNode } from 'react'

const tones = {
  error: 'bg-rose-50 text-rose-800 ring-rose-200',
  info: 'bg-slate-50 text-slate-700 ring-slate-200',
  success: 'bg-gain/10 text-gain ring-gain/20',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
}

export function Alert({ tone = 'info', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ring-1 ${tones[tone]}`}>{children}</div>
}
