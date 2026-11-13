import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout.tsx'
import { Alert } from '../components/ui/Alert.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Input } from '../components/ui/Input.tsx'
import { ApiError, api } from '../lib/api.ts'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Forgot password · Unnati'
  }, [])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setMessage(
        import.meta.env.DEV
          ? 'If that account exists, the reset link is in the development mailbox.'
          : 'If that account exists, a reset link will be sent once email delivery is configured.',
      )
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Unable to start the reset')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Enter the email on the account. We will not say whether it is registered.</p>
      <form className="mt-8 space-y-4" onSubmit={(event) => void onSubmit(event)}>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}
        <Input label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Button type="submit" busy={busy} className="w-full">
          Send reset link
        </Button>
      </form>
      <div className="mt-6 flex justify-between text-sm font-semibold">
        <Link to="/login" className="text-brand">
          Back to sign in
        </Link>
        {import.meta.env.DEV ? (
          <Link to={`/dev/mailbox?email=${encodeURIComponent(email)}`} className="text-slate-500">
            Development mailbox
          </Link>
        ) : null}
      </div>
    </AuthLayout>
  )
}
