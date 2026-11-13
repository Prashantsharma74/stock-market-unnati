import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout.tsx'
import { Alert } from '../components/ui/Alert.tsx'
import { ApiError, api } from '../lib/api.ts'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const started = useRef(false)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>(token ? 'loading' : 'error')
  const [message, setMessage] = useState(token ? '' : 'This confirmation link is missing its token.')

  useEffect(() => {
    document.title = 'Confirm email · Unnati'
    if (!token || started.current) return
    started.current = true
    api('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(() => {
        setStatus('done')
        setMessage('Email confirmed. You can sign in.')
      })
      .catch((error: unknown) => {
        setStatus('error')
        setMessage(error instanceof ApiError ? error.message : 'Unable to confirm this email')
      })
  }, [token])

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Email confirmation</h1>
      <div className="mt-6">
        {status === 'loading' ? <Alert>Confirming your email…</Alert> : null}
        {status === 'done' ? <Alert tone="success">{message}</Alert> : null}
        {status === 'error' ? <Alert tone="error">{message}</Alert> : null}
      </div>
      <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-brand">
        Continue to sign in
      </Link>
    </AuthLayout>
  )
}
