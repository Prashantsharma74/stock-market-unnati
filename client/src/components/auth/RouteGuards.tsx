import { Navigate, Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks.ts'
import { loadSession } from '../../features/auth/authSlice.ts'
import { Button } from '../ui/Button.tsx'
import { Skeleton } from '../ui/Skeleton.tsx'

export function ProtectedRoute() {
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.auth.status)
  const user = useAppSelector((state) => state.auth.user)
  const error = useAppSelector((state) => state.auth.error)

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
        <h1 className="text-2xl font-semibold">Unnati is unreachable</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
        <Button className="mt-6" onClick={() => void dispatch(loadSession())}>
          Try again
        </Button>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function GuestRoute() {
  const status = useAppSelector((state) => state.auth.status)
  const user = useAppSelector((state) => state.auth.user)

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <Skeleton className="h-12 w-40" />
      </div>
    )
  }

  if (user) return <Navigate to="/app" replace />
  return <Outlet />
}
