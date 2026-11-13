import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  busy?: boolean
}

const variants = {
  primary: 'bg-brand text-white shadow-sm hover:bg-brand-dark',
  secondary: 'bg-white text-ink ring-1 ring-line hover:bg-paper',
  ghost: 'bg-transparent text-ink/80 hover:bg-white',
  danger: 'bg-white text-loss ring-1 ring-loss/30 hover:bg-loss/5',
}

export function Button({ variant = 'primary', busy, className = '', children, disabled, ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
      disabled={disabled || busy}
      {...props}
    >
      {busy ? 'Please wait…' : children}
    </button>
  )
}
