export const sampleDataLabel = 'Sample data. Not an NSE or BSE quote.'

export const sampleStocks = ['SMPLBANK', 'ORBITS', 'RGRID', 'LOTUS'] as const

export const sampleIndexes = ['SAMPLE50', 'SAMPLEBANK', 'SAMPLEMID', 'SAMPLEIT', 'SAMPLEAUTO'] as const

export const sampleSymbols = [...sampleStocks, ...sampleIndexes] as const

export type SampleSymbol = (typeof sampleSymbols)[number]

const sampleStockSet = new Set<string>(sampleStocks)
const sampleIndexSet = new Set<string>(sampleIndexes)

export function canonicalSampleSymbol(symbol: string): SampleSymbol | undefined {
  const key = symbol.trim().toUpperCase()
  if (sampleStockSet.has(key) || sampleIndexSet.has(key)) return key as SampleSymbol
  return undefined
}

export function sampleSymbolKind(symbol: SampleSymbol): 'stock' | 'index' {
  return sampleStockSet.has(symbol) ? 'stock' : 'index'
}
