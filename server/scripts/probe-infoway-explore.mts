/**
 * Probes default explore names against Infoway and writes server/data/infoway-allowlist.json
 * with only symbols that return HTTP ret 200 (no 514 permission errors).
 */
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env') })
import { createInfowayProvider } from '../src/modules/market/providers/infoway.provider.ts'
import { indiaExploreCandidates, usExploreCandidates } from '../src/modules/market/exploreSymbols.ts'

const apiKey = process.env.INFOWAY_API_KEY?.trim() ?? ''
if (!apiKey) {
  console.error('INFOWAY_API_KEY is missing in server/.env')
  process.exit(1)
}

const provider = createInfowayProvider({ mode: 'sandbox', apiKey })
type Batch = { fetchQuoteCandidates: (c: { symbol: string; exchange: 'IN' | 'US' }[]) => Promise<unknown[]> }
const batch = provider as Batch

const all = [
  ...indiaExploreCandidates.map((row) => ({ symbol: row.symbol, exchange: row.exchange as 'IN' | 'US' })),
  ...usExploreCandidates.map((row) => ({ symbol: row.symbol, exchange: row.exchange as 'IN' | 'US' })),
]

console.log(`Probing ${all.length} explore symbols (about ${Math.ceil(all.length * 1.2)}s with rate limit)…`)

const ticks = await batch.fetchQuoteCandidates(all)
const india = ticks
  .filter((t) => t && typeof t === 'object' && (t as { exchange?: string }).exchange === 'IN')
  .map((t) => {
    const row = t as { symbol: string; exchange: 'IN' }
    const meta = indiaExploreCandidates.find((c) => c.symbol === row.symbol)
    return { symbol: row.symbol, exchange: 'IN' as const, label: meta?.label ?? row.symbol }
  })
const us = ticks
  .filter((t) => t && typeof t === 'object' && (t as { exchange?: string }).exchange === 'US')
  .map((t) => {
    const row = t as { symbol: string; exchange: 'US' }
    const meta = usExploreCandidates.find((c) => c.symbol === row.symbol)
    return { symbol: row.symbol, exchange: 'US' as const, label: meta?.label ?? row.symbol }
  })

const payload = {
  note: 'Auto-generated permitted explore symbols for this Infoway API key.',
  generatedAt: new Date().toISOString(),
  probed: all.length,
  permitted: india.length + us.length,
  india,
  us,
}

const outPath = path.join(process.cwd(), 'data', 'infoway-allowlist.json')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

console.log(`Wrote ${outPath}`)
console.log(`Permitted: ${india.length} India, ${us.length} US (of ${all.length} probed)`)
if (india.length + us.length === 0) {
  console.warn('No symbols returned. Check API key, plan, and market hours.')
  process.exit(2)
}
