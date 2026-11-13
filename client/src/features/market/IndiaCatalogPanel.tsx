import { useEffect, useState } from 'react'
import { listIndiaSymbols } from './api.ts'

type CatalogItem = {
  code: string
  localSymbol: string
  name: string
  isIndex: boolean
}

type CatalogPayload = {
  provider: string
  total: number
  items: CatalogItem[]
  message?: string
  cachedAt?: string
  stale?: boolean
}

function parseCatalog(value: unknown): CatalogPayload | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (!Array.isArray(record.items) || typeof record.total !== 'number') return null
  return {
    provider: typeof record.provider === 'string' ? record.provider : 'unknown',
    total: record.total,
    items: record.items as CatalogItem[],
    message: typeof record.message === 'string' ? record.message : undefined,
    cachedAt: typeof record.cachedAt === 'string' ? record.cachedAt : undefined,
    stale: record.stale === true,
  }
}

export function IndiaCatalogPanel({ onPick }: { onPick: (localSymbol: string) => void }) {
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [catalog, setCatalog] = useState<CatalogPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const limit = 25

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(draft)
      setOffset(0)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [draft])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const raw = await listIndiaSymbols({ q: query || undefined, offset, limit, indices: false }, controller.signal)
        const parsed = parseCatalog(raw)
        if (!parsed) {
          setCatalog(null)
          setError('Unreadable India symbol list.')
          return
        }
        setCatalog(parsed)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setCatalog(null)
        setError('Could not load the India symbol list.')
      } finally {
        setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [query, offset])

  const total = catalog?.total ?? 0
  const canPrev = offset > 0
  const canNext = catalog ? offset + limit < total : false

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">India symbol list (NSE-style)</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Full universe from Infoway <code className="text-brand">STOCK_IN</code>. Pick a row to load a live quote above — not all symbols update at once.
          </p>
        </div>
        {catalog?.cachedAt ? (
          <p className="text-[10px] text-slate-400">
            Catalog cached {new Date(catalog.cachedAt).toLocaleString('en-IN')}
            {catalog.stale ? ' (stale)' : ''}
          </p>
        ) : null}
      </div>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value.replace(/[^A-Za-z0-9- ]/g, '').slice(0, 40))}
        placeholder="Search ticker or name, e.g. INFY or Reliance"
        className="mt-4 h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      {error ? <p className="mt-3 text-sm text-loss">{error}</p> : null}
      {catalog?.message && catalog.total === 0 ? <p className="mt-3 text-sm text-slate-600">{catalog.message}</p> : null}
      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-paper text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Ticker</th>
              <th className="px-3 py-2 font-semibold">Infoway code</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading && !catalog?.items.length ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  Loading symbol list…
                </td>
              </tr>
            ) : null}
            {catalog?.items.map((item) => (
              <tr key={item.code} className="border-t border-line">
                <td className="px-3 py-2 font-semibold text-ink">{item.localSymbol}</td>
                <td className="px-3 py-2 text-slate-600">{item.code}</td>
                <td className="px-3 py-2 text-slate-700">{item.name}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/15"
                    onClick={() => onPick(item.localSymbol)}
                  >
                    Quote
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {total.toLocaleString('en-IN')} symbols {query ? `matching “${query}”` : 'total'}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canPrev}
            className="rounded-lg border border-line px-3 py-1.5 font-medium disabled:opacity-40"
            onClick={() => setOffset((value) => Math.max(0, value - limit))}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!canNext}
            className="rounded-lg border border-line px-3 py-1.5 font-medium disabled:opacity-40"
            onClick={() => setOffset((value) => value + limit)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
