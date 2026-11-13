import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'
import type { MarketExchange } from './market.types'
import { indiaExploreCandidates, usExploreCandidates, type ExploreCandidate } from './exploreSymbols'

type AllowlistRow = {
  symbol: string
  exchange?: MarketExchange
  label?: string
}

type AllowlistFile = {
  india?: AllowlistRow[]
  us?: AllowlistRow[]
}

const labelBySymbol = new Map<string, string>()
for (const row of [...indiaExploreCandidates, ...usExploreCandidates]) {
  labelBySymbol.set(`${row.exchange}:${row.symbol}`, row.label)
}

function defaultLabel(symbol: string, exchange: MarketExchange) {
  return labelBySymbol.get(`${exchange}:${symbol}`) ?? symbol
}

function parseCommaSymbols(raw: string, exchange: MarketExchange): ExploreCandidate[] {
  const out: ExploreCandidate[] = []
  for (const piece of raw.split(',')) {
    const symbol = piece.trim().toUpperCase()
    if (!/^[A-Z0-9-]{1,20}$/.test(symbol)) continue
    out.push({ symbol, exchange, label: defaultLabel(symbol, exchange) })
  }
  return out
}

function normalizeRow(row: AllowlistRow, exchange: MarketExchange): ExploreCandidate | null {
  const symbol = row.symbol?.trim().toUpperCase()
  if (!symbol || !/^[A-Z0-9-]{1,20}$/.test(symbol)) return null
  const resolvedExchange = row.exchange ?? exchange
  if (resolvedExchange !== 'IN' && resolvedExchange !== 'US') return null
  const label = typeof row.label === 'string' && row.label.trim() ? row.label.trim() : defaultLabel(symbol, resolvedExchange)
  return { symbol, exchange: resolvedExchange, label }
}

function loadAllowlistFile(filePath: string): ExploreCandidate[] {
  if (!fs.existsSync(filePath)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as AllowlistFile
    const india = (parsed.india ?? [])
      .map((row) => normalizeRow(row, 'IN'))
      .filter((row): row is ExploreCandidate => row !== null)
    const us = (parsed.us ?? [])
      .map((row) => normalizeRow(row, 'US'))
      .filter((row): row is ExploreCandidate => row !== null)
    return [...india, ...us]
  } catch (error: unknown) {
    logger.warn('Infoway explore allowlist file could not be read', {
      filePath,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    return []
  }
}

export function resolveExploreCandidates(): { mode: 'default' | 'env' | 'file'; candidates: ExploreCandidate[] } {
  const exploreIn = (process.env.INFOWAY_EXPLORE_IN ?? env.INFOWAY_EXPLORE_IN).trim()
  const exploreUs = (process.env.INFOWAY_EXPLORE_US ?? env.INFOWAY_EXPLORE_US).trim()
  const fromEnv = [...parseCommaSymbols(exploreIn, 'IN'), ...parseCommaSymbols(exploreUs, 'US')]
  if (fromEnv.length > 0) {
    return { mode: 'env', candidates: fromEnv }
  }

  const allowlistPath = (process.env.INFOWAY_EXPLORE_ALLOWLIST_PATH ?? env.INFOWAY_EXPLORE_ALLOWLIST_PATH).trim()
  const moduleData = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'data', 'infoway-allowlist.json')
  const candidates = [
    ...(allowlistPath ? [allowlistPath] : []),
    path.join(process.cwd(), 'data', 'infoway-allowlist.json'),
    path.join(process.cwd(), 'server', 'data', 'infoway-allowlist.json'),
    moduleData,
  ]
  for (const filePath of candidates) {
    const fromFile = loadAllowlistFile(filePath)
    if (fromFile.length > 0) {
      return { mode: 'file', candidates: fromFile }
    }
  }

  return { mode: 'default', candidates: [...indiaExploreCandidates, ...usExploreCandidates] }
}
