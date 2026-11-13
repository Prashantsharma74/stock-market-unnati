import type { InputHTMLAttributes, ReactNode } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
  trailing?: ReactNode
}

export function Input({ label, error, hint, trailing, className = '', id, ...props }: Props) {
  const inputId = id ?? props.name

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-navy-900">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/15 ${error ? 'border-rose-300' : 'border-line'} ${trailing ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {trailing ? <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div> : null}
      </div>
      {error ? <p className="mt-1.5 text-sm text-rose-700">{error}</p> : null}
      {hint && !error ? <p className="mt-1.5 text-sm text-slate-500">{hint}</p> : null}
    </div>
  )
}
