import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../brand/Logo.tsx'

export function AuthLayout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-14 text-center">
        <p className="font-display text-4xl font-semibold tracking-tight text-ink/80 sm:text-6xl">Invest with clarity</p>
      </div>
      <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
        <div className="grid w-full max-w-3xl animate-rise overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-40px_rgba(28,25,20,0.55)] md:grid-cols-2">
          <div
            className="relative hidden min-h-80 flex-col justify-between overflow-hidden bg-brand p-8 text-white md:flex"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(224,138,42,0.18), transparent 42%), repeating-linear-gradient(135deg, rgba(255,250,243,0.07) 0 1px, transparent 1px 14px)',
            }}
          >
            <Logo tone="light" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Unnati</p>
              <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">{title ?? 'Simple, clear investing.'}</h1>
            </div>
            <p className="text-sm text-white/75">Sample markets. No orders. No money collected.</p>
          </div>
          <div className="relative p-6 sm:p-8">
            <Link to="/" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-paper hover:text-ink" aria-label="Close">
              ×
            </Link>
            <div className="mb-6 md:hidden">
              <Logo />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
