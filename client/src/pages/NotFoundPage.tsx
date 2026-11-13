import { Link } from 'react-router-dom'
import { useAppSelector } from '../app/hooks.ts'

export function NotFoundPage() {
  const user = useAppSelector((state) => state.auth.user)

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-dark">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold">That page is not part of Unnati</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">The address does not match a screen in this release.</p>
      <Link to={user ? '/app' : '/'} className="mt-6 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">
        {user ? 'Go to dashboard' : 'Go to home'}
      </Link>
    </div>
  )
}
