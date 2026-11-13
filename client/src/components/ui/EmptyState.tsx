import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {icon ? <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">{icon}</div> : null}
      <h1 className="text-xl font-semibold text-navy-900">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
