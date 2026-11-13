export type ExploreBond = {
  id: string
  issuer: string
  rate: number
  months: number
  rating: string
  ratingTone: 'high' | 'mid' | 'low'
}

/** Demo row only — not live market data. */
export const exploreSampleBonds: ExploreBond[] = [
  { id: 'navi', issuer: "Navi Finserv Ltd. May '28", rate: 10.1, months: 18, rating: 'A+', ratingTone: 'mid' },
  { id: 'indel', issuer: "Indel Money Ltd. Aug '28", rate: 10.6, months: 21, rating: 'A-', ratingTone: 'mid' },
  { id: 'muthoot', issuer: "Muthoot Fincorp Ltd. Sep '29", rate: 9.1, months: 34, rating: 'AA', ratingTone: 'high' },
  { id: 'satin', issuer: "Satin Finserv Ltd. Jan '29", rate: 11.8, months: 25, rating: 'A-', ratingTone: 'mid' },
]
