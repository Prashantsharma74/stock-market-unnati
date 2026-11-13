import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout.tsx'
import { Alert } from '../components/ui/Alert.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Input } from '../components/ui/Input.tsx'
import { ApiError, api, fieldErrors } from '../lib/api.ts'
import { maxAdultDob } from '../lib/format.ts'

type RegisterResult = {
  email: string
  emailDelivery: 'dev-mailbox' | 'unconfigured'
}

export function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    dateOfBirth: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState<RegisterResult | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Create account · Unnati'
  }, [])

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setErrors({})
    setFormError('')
    try {
      const created = await api<RegisterResult>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setResult(created)
    } catch (error) {
      setErrors(fieldErrors(error))
      setFormError(error instanceof ApiError ? error.message : 'Unable to create the account')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <AuthLayout>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Confirm your email</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {result.emailDelivery === 'dev-mailbox'
            ? `A confirmation link for ${result.email} is waiting in the development mailbox. Unnati does not send real email in this setup.`
            : 'This server has no email provider configured, so the confirmation link cannot be delivered yet.'}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {result.emailDelivery === 'dev-mailbox' && import.meta.env.DEV ? (
            <Link to={`/dev/mailbox?email=${encodeURIComponent(result.email)}`} className="rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white">
              Open development mailbox
            </Link>
          ) : null}
          <Link to="/login" className="text-center text-sm font-semibold text-brand">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">We ask for a name, email, mobile, and date of birth. PAN and bank details are not collected.</p>
      <form className="mt-8 space-y-4" onSubmit={(event) => void onSubmit(event)}>
        {formError ? <Alert tone="error">{formError}</Alert> : null}
        <Input label="Full name" name="fullName" autoComplete="name" value={form.fullName} error={errors.fullName} onChange={(event) => update('fullName', event.target.value)} required />
        <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} error={errors.email} onChange={(event) => update('email', event.target.value)} required />
        <Input label="Mobile" name="mobile" inputMode="tel" autoComplete="tel" placeholder="9876543210" value={form.mobile} error={errors.mobile} onChange={(event) => update('mobile', event.target.value)} required />
        <Input label="Date of birth" name="dateOfBirth" type="date" max={maxAdultDob()} value={form.dateOfBirth} error={errors.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} required />
        <Input
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          value={form.password}
          error={errors.password}
          onChange={(event) => update('password', event.target.value)}
          required
          trailing={
            <button type="button" className="rounded-lg p-2 text-slate-500" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <Button type="submit" busy={busy} className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-brand">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
