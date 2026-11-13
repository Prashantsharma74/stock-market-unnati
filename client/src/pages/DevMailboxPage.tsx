import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout.tsx'
import { Alert } from '../components/ui/Alert.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Input } from '../components/ui/Input.tsx'
import { ApiError, api } from '../lib/api.ts'
import { formatDate } from '../lib/format.ts'
import type { DevEmail } from '../types/models.ts'

function MessageText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
      {parts.map((part, index) =>
        part.startsWith('http') ? (
          <a key={`${part}-${index}`} href={part} className="font-medium text-brand underline">
            {part}
          </a>
        ) : (
          <span key={`${index}-${part.slice(0, 12)}`}>{part}</span>
        ),
      )}
    </p>
  )
}

export function DevMailboxPage() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [messages, setMessages] = useState<DevEmail[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(Boolean(import.meta.env.DEV))
  const initialEmail = params.get('email') ?? ''

  useEffect(() => {
    document.title = 'Development mailbox · Unnati'
    if (!import.meta.env.DEV) return
    let active = true
    const query = initialEmail ? `?email=${encodeURIComponent(initialEmail)}` : ''
    api<DevEmail[]>(`/api/auth/dev/mailbox${query}`)
      .then((items) => {
        if (!active) return
        setMessages(items)
        setBusy(false)
      })
      .catch((caught: unknown) => {
        if (!active) return
        setError(caught instanceof ApiError ? caught.message : 'Unable to load the mailbox')
        setBusy(false)
      })
    return () => {
      active = false
    }
  }, [initialEmail])

  const load = async (event?: FormEvent) => {
    event?.preventDefault()
    setBusy(true)
    setError('')
    try {
      const query = email ? `?email=${encodeURIComponent(email)}` : ''
      setMessages(await api<DevEmail[]>(`/api/auth/dev/mailbox${query}`))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Unable to load the mailbox')
    } finally {
      setBusy(false)
    }
  }

  if (!import.meta.env.DEV) {
    return (
      <AuthLayout>
        <h1 className="text-3xl font-semibold">Mailbox unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">The development mailbox is disabled outside local development. Configure an email provider before relying on verification links.</p>
        <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-brand">
          Back to sign in
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-semibold tracking-tight">Development mailbox</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Messages are stored in the local database. Nothing is delivered to a real inbox.</p>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void load(event)}>
        <div className="flex-1">
          <Input label="Filter by email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <Button type="submit" busy={busy}>
          Refresh
        </Button>
      </form>
      {error ? (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
      <div className="mt-6 space-y-4">
        {!busy && messages.length === 0 ? <Alert>No messages yet.</Alert> : null}
        {messages.map((message) => (
          <article key={message.id} className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatDate(message.createdAt)}</p>
            <h2 className="mt-1 text-base font-semibold">{message.subject}</h2>
            <p className="text-xs text-slate-500">{message.to}</p>
            <div className="mt-3">
              <MessageText text={message.text} />
            </div>
          </article>
        ))}
      </div>
    </AuthLayout>
  )
}
