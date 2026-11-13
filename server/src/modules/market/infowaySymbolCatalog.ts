import { env } from '../../config/env'
import { logger } from '../../utils/logger'

const catalogOrigin = 'https://data.infoway.io/common/basic/symbols'
const catalogTtlMs = 24 * 60 * 60 * 1000

export type IndiaCatalogRow = {
  /** Infoway quote code, e.g. INFY.IN */
  code: string
  /** NSE-style ticker without suffix, e.g. INFY */
  localSymbol: string
  name: string
  isIndex: boolean
}

type CatalogCache = {
  fetchedAt: number
  rows: IndiaCatalogRow[]
}

let cache: CatalogCache | null = null
let inFlight: Promise<IndiaCatalogRow[]> | null = null

function parseRow(row: unknown): IndiaCatalogRow | null {
  if (!row || typeof row !== 'object') return null
  const record = row as Record<string, unknown>
  if (typeof record.symbol !== 'string') return null
  const code = record.symbol.trim().toUpperCase()
  if (!code.endsWith('.IN')) return null
  const localSymbol = code.slice(0, -3)
  if (!/^[A-Z0-9-]{1,20}$/.test(localSymbol)) return null
  const name =
    typeof record.name_en === 'string' && record.name_en.trim()
      ? record.name_en.trim()
      : typeof record.name_local === 'string' && record.name_local.trim()
        ? record.name_local.trim()
        : localSymbol
  const isIndex = record.index === true
  return { code, localSymbol, name, isIndex }
}

async function fetchCatalog(apiKey: string): Promise<IndiaCatalogRow[]> {
  const url = `${catalogOrigin}?type=STOCK_IN`
  const response = await fetch(url, {
    method: 'GET',
    headers: { apiKey, Accept: 'application/json' },
    signal: AbortSignal.timeout(120_000),
  })
  const body = await response.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    throw new Error('Infoway symbol list returned non-JSON.')
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Infoway symbol list shape was invalid.')
  const record = parsed as Record<string, unknown>
  const ret = typeof record.ret === 'number' ? record.ret : null
  if (response.status !== 200 || ret !== 200 || !Array.isArray(record.data)) {
    const msg = typeof record.msg === 'string' ? record.msg : body.slice(0, 200)
    throw new Error(`Infoway symbol list failed (HTTP ${response.status}, ret ${ret ?? 'n/a'}). ${msg}`)
  }
  const rows: IndiaCatalogRow[] = []
  for (const item of record.data) {
    const row = parseRow(item)
    if (row) rows.push(row)
  }
  rows.sort((a, b) => a.localSymbol.localeCompare(b.localSymbol))
  logger.info('Infoway India catalog loaded', { count: rows.length })
  return rows
}

export async function getIndiaSymbolCatalog(options?: { refresh?: boolean; apiKey?: string }) {
  const apiKey = (options?.apiKey ?? env.INFOWAY_API_KEY).trim()
  if (!apiKey) return { ok: false as const, reason: 'missing_key', rows: [] as IndiaCatalogRow[] }

  const refresh = options?.refresh === true
  if (!refresh && cache && Date.now() - cache.fetchedAt < catalogTtlMs) {
    return { ok: true as const, rows: cache.rows, cachedAt: new Date(cache.fetchedAt).toISOString() }
  }

  if (inFlight) {
    const rows = await inFlight
    return { ok: true as const, rows, cachedAt: cache ? new Date(cache.fetchedAt).toISOString() : undefined }
  }

  const run = fetchCatalog(apiKey)
    .then((rows) => {
      cache = { fetchedAt: Date.now(), rows }
      return rows
    })
    .finally(() => {
      if (inFlight === run) inFlight = null
    })
  inFlight = run

  try {
    const rows = await run
    return { ok: true as const, rows, cachedAt: new Date(cache!.fetchedAt).toISOString() }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.warn('Infoway India catalog fetch failed', { message })
    if (cache) {
      return { ok: true as const, rows: cache.rows, cachedAt: new Date(cache.fetchedAt).toISOString(), stale: true, message }
    }
    return { ok: false as const, reason: 'fetch_failed', message, rows: [] as IndiaCatalogRow[] }
  }
}

export function searchIndiaCatalog(
  rows: IndiaCatalogRow[],
  query: { q?: string; stocksOnly?: boolean; offset: number; limit: number },
) {
  const needle = query.q?.trim().toUpperCase()
  let filtered = rows
  if (query.stocksOnly !== false) {
    filtered = filtered.filter((row) => !row.isIndex)
  }
  if (needle) {
    filtered = filtered.filter(
      (row) => row.localSymbol.includes(needle) || row.name.toUpperCase().includes(needle) || row.code.includes(needle),
    )
  }
  const total = filtered.length
  const items = filtered.slice(query.offset, query.offset + query.limit)
  return { total, items }
}

/** Test helper */
export function resetIndiaCatalogCacheForTests() {
  cache = null
  inFlight = null
}
