import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test, before, after } from 'node:test'
import { resolveExploreCandidates } from './exploreAllowlist.ts'

const prevIn = process.env.INFOWAY_EXPLORE_IN
const prevUs = process.env.INFOWAY_EXPLORE_US
const prevPath = process.env.INFOWAY_EXPLORE_ALLOWLIST_PATH

before(() => {
  process.env.INFOWAY_EXPLORE_IN = ''
  process.env.INFOWAY_EXPLORE_US = ''
  process.env.INFOWAY_EXPLORE_ALLOWLIST_PATH = ''
})

after(() => {
  if (prevIn === undefined) delete process.env.INFOWAY_EXPLORE_IN
  else process.env.INFOWAY_EXPLORE_IN = prevIn
  if (prevUs === undefined) delete process.env.INFOWAY_EXPLORE_US
  else process.env.INFOWAY_EXPLORE_US = prevUs
  if (prevPath === undefined) delete process.env.INFOWAY_EXPLORE_ALLOWLIST_PATH
  else process.env.INFOWAY_EXPLORE_ALLOWLIST_PATH = prevPath
})

test('resolveExploreCandidates prefers env over file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'infoway-allow-'))
  const file = path.join(dir, 'list.json')
  fs.writeFileSync(
    file,
    JSON.stringify({ india: [{ symbol: 'TCS', exchange: 'IN' }], us: [] }),
    'utf8',
  )
  process.env.INFOWAY_EXPLORE_ALLOWLIST_PATH = file
  process.env.INFOWAY_EXPLORE_IN = 'RELIANCE'
  const resolved = resolveExploreCandidates()
  assert.equal(resolved.mode, 'env')
  assert.deepEqual(
    resolved.candidates.map((row) => `${row.exchange}:${row.symbol}`),
    ['IN:RELIANCE'],
  )
})

test('resolveExploreCandidates reads allowlist file when env empty', () => {
  process.env.INFOWAY_EXPLORE_IN = ''
  process.env.INFOWAY_EXPLORE_US = ''
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'infoway-allow-'))
  const file = path.join(dir, 'list.json')
  fs.writeFileSync(
    file,
    JSON.stringify({
      india: [{ symbol: 'RELIANCE', exchange: 'IN' }],
      us: [{ symbol: 'AAPL', exchange: 'US' }],
    }),
    'utf8',
  )
  process.env.INFOWAY_EXPLORE_ALLOWLIST_PATH = file
  const resolved = resolveExploreCandidates()
  assert.equal(resolved.mode, 'file')
  assert.equal(resolved.candidates.length, 2)
})
