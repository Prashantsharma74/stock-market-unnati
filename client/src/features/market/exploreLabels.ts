const labels: Record<string, string> = {
  RELIANCE: 'Reliance Industries',
  TCS: 'TCS',
  INFY: 'Infosys',
  HDFCBANK: 'HDFC Bank',
  ICICIBANK: 'ICICI Bank',
  SBIN: 'State Bank of India',
  BHARTIARTL: 'Bharti Airtel',
  ITC: 'ITC',
  LT: 'Larsen & Toubro',
  AXISBANK: 'Axis Bank',
  KOTAKBANK: 'Kotak Mahindra Bank',
  WIPRO: 'Wipro',
  NVDA: 'NVIDIA',
  TSLA: 'Tesla',
  AMD: 'Advanced Micro Devices',
  GOOGL: 'Alphabet (Class A)',
  AAPL: 'Apple',
  MSFT: 'Microsoft',
  AMZN: 'Amazon',
  META: 'Meta Platforms',
}

export function exploreLabel(symbol: string) {
  return labels[symbol] ?? symbol
}
