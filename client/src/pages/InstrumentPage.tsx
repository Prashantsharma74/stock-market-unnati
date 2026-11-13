import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Alert } from '../components/ui/Alert.tsx'
import { Badge } from '../components/ui/Badge.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Card } from '../components/ui/Card.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { Skeleton } from '../components/ui/Skeleton.tsx'
import { useToast } from '../components/ui/useToast.ts'
import { ApiError, api } from '../lib/api.ts'
import type { InstrumentDetail } from '../types/models.ts'

export function InstrumentPage() {
  const { id = '' } = useParams()
  const toast = useToast()
  const [detail, setDetail] = useState<InstrumentDetail | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [loadedId, setLoadedId] = useState(id)

  if (loadedId !== id) {
    setLoadedId(id)
    setStatus('loading')
    setDetail(null)
    setError('')
  }

  useEffect(() => {
    let active = true
    api<InstrumentDetail>(`/api/dashboard/instruments/${id}`)
      .then((instrument) => {
        if (!active) return
        setDetail(instrument)
        setStatus('ready')
        document.title = `${instrument.name} · Unnati`
      })
      .catch((caught: unknown) => {
        if (!active) return
        setStatus('error')
        setError(caught instanceof ApiError ? caught.message : 'Unable to load this instrument')
      })
    return () => {
      active = false
    }
  }, [id])

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (status === 'error' || !detail) {
    return (
      <EmptyState
        title="Instrument not in the sample set"
        body={error || 'This id is not part of the simulated catalog.'}
        action={
          <Link to="/app" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            Back to dashboard
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{detail.category}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{detail.name}</h1>
        </div>
        <Badge tone="simulated">{detail.dataSource}</Badge>
      </div>
      <Alert tone="warning">{detail.disclaimer}</Alert>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <h2 className="text-base font-semibold">Illustrative path</h2>
          <p className="mt-1 text-sm text-slate-500">Indexed sample points for layout only. This is not a NAV history or a traded price series.</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={detail.series}>
                <CartesianGrid stroke="#e4dccf" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6b645b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b645b', fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#2a3d78" fill="#e7eaf6" strokeWidth={2} name="Sample index" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Sample facts</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{detail.summary}</p>
          <dl className="mt-4 space-y-3">
            {detail.metrics.map((metric) => (
              <div key={metric.label} className="flex items-start justify-between gap-4 text-sm">
                <dt className="text-slate-500">{metric.label}</dt>
                <dd className="text-right font-medium">{metric.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-6 text-slate-600">{detail.note}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => toast('Unnati cannot place orders. No broker, payment, or fund provider is connected.', 'info')}
            >
              Invest
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => toast('Personal watchlists arrive in a later release. This catalog is read-only.', 'info')}
            >
              Save to watchlist
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
