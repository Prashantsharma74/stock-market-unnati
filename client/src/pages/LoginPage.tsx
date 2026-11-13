import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../app/hooks.ts'
import { AuthLayout } from '../components/layout/AuthLayout.tsx'
import { useToast } from '../components/ui/useToast.ts'
import { Alert } from '../components/ui/Alert.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Input } from '../components/ui/Input.tsx'
import { login } from '../features/auth/authSlice.ts'
import { ApiError, api } from '../lib/api.ts'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    document.title = 'Sign in · Unnati'
  }, [])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    setNeedsVerification(false)
    const result = await dispatch(login({ email, password }))
    setBusy(false)
    if (login.fulfilled.match(result)) {
      navigate('/app/stocks/explore')
      return
    }
    const payload = result.payload
    setError(payload?.message ?? 'Unable to sign in')
    setNeedsVerification(payload?.code === 'EMAIL_NOT_VERIFIED')
  }

  const resend = async () => {
    setBusy(true)
    setInfo('')
    try {
      await api('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setInfo('If the account still needs confirmation, a new link is in the development mailbox.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Unable to resend the link')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome to Unnati</h1>
      <button
        type="button"
        className="mt-6 flex w-full items-center justify-center rounded-lg border border-line py-2.5 text-sm font-medium"
        onClick={() => toast('Google sign-in is not connected.', 'info')}
      >
        Continue with Google
      </button>
      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        Or
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Demo account demo@unnati.app / Demo@12345
      </p>
      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {info ? <Alert tone="success">{info}</Alert> : null}
        <Input label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          trailing={
            <button type="button" className="rounded-lg p-2 text-slate-500" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="font-medium text-brand">
            Forgot password
          </Link>
          {import.meta.env.DEV ? (
            <Link to="/dev/mailbox" className="font-medium text-slate-500">
              Dev mailbox
            </Link>
          ) : null}
        </div>
        <Button type="submit" busy={busy} className="w-full">
          Sign in
        </Button>
        {needsVerification ? (
          <Button type="button" variant="secondary" className="w-full" onClick={() => void resend()} disabled={!email}>
            Resend confirmation link
          </Button>
        ) : null}
      </form>
      <p className="mt-6 text-sm text-slate-600">
        New to Unnati?{' '}
        <Link to="/register" className="font-semibold text-brand">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
