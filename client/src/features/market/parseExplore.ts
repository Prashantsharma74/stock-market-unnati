import type { NormalizedTick } from './types.ts'
import { presentListedTick } from './parse.ts'

export type ExplorePayload = {
  dataSource: 'unconfigured' | 'mock' | 'provider'
  india: NormalizedTick[]
  us: NormalizedTick[]
  feedMessage?: string
}

function tickList(value: unknown): NormalizedTick[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => presentListedTick(item, 'provider', null))
    .filter((item): item is NormalizedTick => item !== null)
}

export function parseExploreList(value: unknown): ExplorePayload | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const dataSource = record.dataSource
  if (dataSource !== 'unconfigured' && dataSource !== 'mock' && dataSource !== 'provider') return null
  if (Array.isArray(record.items)) {
    const items = tickList(record.items)
    return {
      dataSource,
      india: items.filter((tick) => tick.exchange === 'IN'),
      us: items.filter((tick) => tick.exchange === 'US'),
    }
  }
  const feedMessage = typeof record.feedMessage === 'string' ? record.feedMessage : undefined
  return {
    dataSource,
    india: tickList(record.india),
    us: tickList(record.us),
    feedMessage,
  }
}
