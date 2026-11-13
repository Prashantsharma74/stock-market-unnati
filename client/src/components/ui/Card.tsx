import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 shadow-[0_12px_30px_-22px_rgba(42,61,120,0.55)] ${className}`}>
      {children}
    </section>
  )
}
