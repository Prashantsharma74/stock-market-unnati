import { AppError } from '../../common/AppError'
import { getDashboardSnapshot, getSampleInstrument, searchSampleCatalog } from './demoData'

export function getDashboard() {
  return getDashboardSnapshot()
}

export function searchDashboard(query: string) {
  return {
    dataSource: 'simulated' as const,
    results: searchSampleCatalog(query),
  }
}

export function getInstrument(id: string) {
  const instrument = getSampleInstrument(id)
  if (!instrument) throw new AppError('Sample instrument not found', 404, 'NOT_FOUND')
  return instrument
}
