import type { MarketExchange } from './market.types'

export type ExploreCandidate = { symbol: string; exchange: MarketExchange; label: string }

/** Popular India names (NSE-style codes). Infoway returns only symbols that trade. */
export const indiaExploreCandidates: ExploreCandidate[] = [
  { symbol: 'RELIANCE', exchange: 'IN', label: 'Reliance Industries' },
  { symbol: 'TCS', exchange: 'IN', label: 'TCS' },
  { symbol: 'INFY', exchange: 'IN', label: 'Infosys' },
  { symbol: 'HDFCBANK', exchange: 'IN', label: 'HDFC Bank' },
  { symbol: 'ICICIBANK', exchange: 'IN', label: 'ICICI Bank' },
  { symbol: 'SBIN', exchange: 'IN', label: 'State Bank of India' },
  { symbol: 'BHARTIARTL', exchange: 'IN', label: 'Bharti Airtel' },
  { symbol: 'ITC', exchange: 'IN', label: 'ITC' },
  { symbol: 'LT', exchange: 'IN', label: 'Larsen & Toubro' },
  { symbol: 'AXISBANK', exchange: 'IN', label: 'Axis Bank' },
  { symbol: 'KOTAKBANK', exchange: 'IN', label: 'Kotak Mahindra Bank' },
  { symbol: 'WIPRO', exchange: 'IN', label: 'Wipro' },
]

/** Popular US names for a Groww-style second row. */
/** Plan-friendly symbols first (AAPL often works on starter Infoway tiers). */
export const usExploreCandidates: ExploreCandidate[] = [
  { symbol: 'AAPL', exchange: 'US', label: 'Apple' },
  { symbol: 'MSFT', exchange: 'US', label: 'Microsoft' },
  { symbol: 'GOOGL', exchange: 'US', label: 'Alphabet (Class A)' },
  { symbol: 'AMZN', exchange: 'US', label: 'Amazon' },
  { symbol: 'META', exchange: 'US', label: 'Meta Platforms' },
  { symbol: 'NVDA', exchange: 'US', label: 'NVIDIA' },
  { symbol: 'TSLA', exchange: 'US', label: 'Tesla' },
  { symbol: 'AMD', exchange: 'US', label: 'Advanced Micro Devices' },
]

export const exploreSymbolCandidates: { symbol: string; exchange: MarketExchange }[] = [
  ...indiaExploreCandidates,
  ...usExploreCandidates,
]
