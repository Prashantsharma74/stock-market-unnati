import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout.tsx'
import { Alert } from '../components/ui/Alert.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Input } from '../components/ui/Input.tsx'
import { ApiError, api, fieldErrors } from '../lib/api.ts'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Choose a new password · Unnati'
  }, [])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setFieldError('')
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setMessage('Password updated. You can sign in with it now.')
    } catch (caught) {
      setFieldError(fieldErrors(caught).password ?? '')
      setError(caught instanceof ApiError ? caught.message : 'Unable to reset the password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Choose a new password</h1>
      <form className="mt-8 space-y-4" onSubmit={(event) => void onSubmit(event)}>
        {!token ? <Alert tone="error">This reset link is missing its token. Request a new one.</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}
        <Input
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          value={password}
          error={fieldError}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" busy={busy} className="w-full" disabled={!token || Boolean(message)}>
          Update password
        </Button>
      </form>
      <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-brand">
        Back to sign in
      </Link>
    </AuthLayout>
  )
}
