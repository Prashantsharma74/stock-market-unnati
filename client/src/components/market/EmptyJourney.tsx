import type { ReactNode } from 'react'

export function EmptyJourney({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex h-full min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative mb-6 h-24 w-24 animate-float" aria-hidden="true">
        <div className="absolute inset-x-2 bottom-2 h-3 rounded-full bg-accent/30" />
        <div className="absolute left-1/2 top-4 h-14 w-10 -translate-x-1/2 rounded-t-2xl border-2 border-brand bg-brand/10" />
        <div className="absolute left-1/2 top-1 h-4 w-4 -translate-x-1/2 rounded-full bg-accent" />
      </div>
      {title ? <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2> : null}
      {body ? <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
