const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

export type SampleMetric = { label: string; value: string }

export type SampleInstrument = {
  id: string
  name: string
  kind: 'fund' | 'stock' | 'index'
  category: string
  summary: string
  metrics: SampleMetric[]
  series: { month: string; value: number }[]
}

export type DashboardSnapshot = {
  dataSource: 'simulated'
  datasetId: 'finora-sample-2026'
  disclaimer: string
  asOfLabel: string
  summary: {
    portfolioValue: number
    invested: number
    returns: number
    returnsPct: number
    todayChange: number
    todayChangePct: number
  }
  allocation: { name: string; value: number }[]
  performance: { month: string; value: number }[]
  holdings: {
    id: string
    name: string
    category: string
    invested: number
    current: number
    returns: number
    returnsPct: number
    dayChange: number
    dayChangePct: number
  }[]
  watchlist: {
    id: string
    name: string
    symbol: string
    price: number
    changePct: number
  }[]
  transactions: {
    id: string
    date: string
    name: string
    kind: 'SIP' | 'Lumpsum'
    amount: number
    status: 'Simulated'
  }[]
  topFunds: {
    id: string
    name: string
    category: string
    scenarioGainPct: number
  }[]
  popularStocks: {
    id: string
    name: string
    symbol: string
    price: number
    changePct: number
  }[]
  marketOverview: {
    id: string
    name: string
    level: number
    changePct: number
  }[]
  catalog: { id: string; name: string; kind: SampleInstrument['kind']; hint: string }[]
}

function series(start: number, end: number) {
  return months.map((month, index) => ({
    month,
    value: Math.round(start + ((end - start) * index) / (months.length - 1)),
  }))
}

const disclaimer =
  'Illustrative demo data for product exploration. These prices, NAVs, and returns are not from NSE, BSE, AMFI, or any fund house, and they are not a forecast.'

export const sampleInstruments: SampleInstrument[] = [
  {
    id: 'fund-northwind',
    name: 'Northwind Large Cap Sample Fund',
    kind: 'fund',
    category: 'Equity · Large cap',
    summary: 'A fictional large-cap equity fund used to demonstrate holdings, allocation, and a fund detail layout.',
    metrics: [
      { label: 'Demo invested amount', value: '₹1,80,000' },
      { label: 'Demo current value', value: '₹2,14,500' },
      { label: 'Demo gain since sample purchase', value: '+19.17%' },
      { label: 'Demo risk label', value: 'Moderately high' },
      { label: 'Sample minimum', value: '₹500' },
    ],
    series: series(100, 119),
  },
  {
    id: 'fund-deccan',
    name: 'Deccan Flexi Sample Fund',
    kind: 'fund',
    category: 'Equity · Flexi cap',
    summary: 'A fictional flexi-cap fund. The path below is a straight sample curve, not a published NAV history.',
    metrics: [
      { label: 'Demo invested amount', value: '₹1,20,000' },
      { label: 'Demo current value', value: '₹1,41,600' },
      { label: 'Demo gain since sample purchase', value: '+18.00%' },
      { label: 'Demo risk label', value: 'Very high' },
      { label: 'Sample minimum', value: '₹500' },
    ],
    series: series(100, 118),
  },
  {
    id: 'fund-malabar',
    name: 'Malabar Short Duration Sample Fund',
    kind: 'fund',
    category: 'Debt · Short duration',
    summary: 'A fictional debt fund included so the sample portfolio is not entirely equity.',
    metrics: [
      { label: 'Demo invested amount', value: '₹70,000' },
      { label: 'Demo current value', value: '₹74,830' },
      { label: 'Demo gain since sample purchase', value: '+6.90%' },
      { label: 'Demo risk label', value: 'Moderate' },
      { label: 'Sample minimum', value: '₹500' },
    ],
    series: series(100, 107),
  },
  {
    id: 'fund-godavari',
    name: 'Godavari Hybrid Sample Fund',
    kind: 'fund',
    category: 'Hybrid · Aggressive',
    summary: 'A fictional hybrid fund used for the lumpsum row in the sample transaction list.',
    metrics: [
      { label: 'Demo invested amount', value: '₹40,000' },
      { label: 'Demo current value', value: '₹51,420' },
      { label: 'Demo gain since sample purchase', value: '+28.55%' },
      { label: 'Demo risk label', value: 'High' },
      { label: 'Sample minimum', value: '₹1,000' },
    ],
    series: series(100, 129),
  },
  {
    id: 'stock-samplebank',
    name: 'Sample Bank Ltd',
    kind: 'stock',
    category: 'Financials',
    summary: 'A fictional listed company. The price is not a delayed or live exchange quote.',
    metrics: [
      { label: 'Demo price', value: '₹842.50' },
      { label: 'Demo day move', value: '+1.80%' },
      { label: 'Demo symbol', value: 'SMPLBANK' },
    ],
    series: series(760, 843),
  },
  {
    id: 'stock-orbitsoft',
    name: 'Orbitsoft Sample Ltd',
    kind: 'stock',
    category: 'Information technology',
    summary: 'A fictional technology company for the sample watchlist.',
    metrics: [
      { label: 'Demo price', value: '₹1,264.00' },
      { label: 'Demo day move', value: '-0.60%' },
      { label: 'Demo symbol', value: 'ORBITS' },
    ],
    series: series(1100, 1264),
  },
  {
    id: 'stock-rivergrid',
    name: 'Rivergrid Energy Sample',
    kind: 'stock',
    category: 'Utilities',
    summary: 'A fictional utility used to show a positive day move in the sample watchlist.',
    metrics: [
      { label: 'Demo price', value: '₹318.40' },
      { label: 'Demo day move', value: '+2.40%' },
      { label: 'Demo symbol', value: 'RGRID' },
    ],
    series: series(250, 318),
  },
  {
    id: 'stock-lotuschem',
    name: 'Lotuschem Sample Ltd',
    kind: 'stock',
    category: 'Materials',
    summary: 'A fictional materials company. Trading is not available.',
    metrics: [
      { label: 'Demo price', value: '₹590.00' },
      { label: 'Demo day move', value: '+0.40%' },
      { label: 'Demo symbol', value: 'LOTUS' },
    ],
    series: series(540, 590),
  },
  {
    id: 'index-sample50',
    name: 'Sample 50',
    kind: 'index',
    category: 'Broad equity sample',
    summary: 'A fictional index level. It is not the Nifty 50, Sensex, or any published benchmark.',
    metrics: [
      { label: 'Demo level', value: '22,480' },
      { label: 'Demo day move', value: '+0.35%' },
    ],
    series: series(19800, 22480),
  },
  {
    id: 'index-samplemid',
    name: 'Sample Midcap',
    kind: 'index',
    category: 'Mid-size equity sample',
    summary: 'A fictional mid-cap index used in the market overview card.',
    metrics: [
      { label: 'Demo level', value: '51,220' },
      { label: 'Demo day move', value: '-0.22%' },
    ],
    series: series(47000, 51220),
  },
  {
    id: 'index-samplebank',
    name: 'Sample Bank',
    kind: 'index',
    category: 'Financials sample',
    summary: 'A fictional banking index. It is not a tradable product in Unnati.',
    metrics: [
      { label: 'Demo level', value: '49,810' },
      { label: 'Demo day move', value: '+0.58%' },
    ],
    series: series(44000, 49810),
  },
]

const byId = new Map(sampleInstruments.map((item) => [item.id, item]))

export function getSampleInstrument(id: string) {
  const instrument = byId.get(id)
  if (!instrument) return null
  return {
    ...instrument,
    dataSource: 'simulated' as const,
    disclaimer,
    note: 'Orders, watchlist editing, and live prices are not available in this release.',
  }
}

export function searchSampleCatalog(query: string) {
  const needle = query.trim().toLowerCase()
  return sampleInstruments
    .filter((item) => {
      if (!needle) return true
      return `${item.name} ${item.category} ${item.kind}`.toLowerCase().includes(needle)
    })
    .slice(0, 8)
    .map((item) => ({ id: item.id, name: item.name, kind: item.kind, hint: item.category }))
}

export function getDashboardSnapshot(): DashboardSnapshot {
  return {
    dataSource: 'simulated',
    datasetId: 'finora-sample-2026',
    disclaimer,
    asOfLabel: 'Sample dataset · not connected to an exchange or fund registrar',
    summary: {
      portfolioValue: 482350,
      invested: 410000,
      returns: 72350,
      returnsPct: 17.65,
      todayChange: 1240,
      todayChangePct: 0.26,
    },
    allocation: [
      { name: 'Equity', value: 356100 },
      { name: 'Debt', value: 74830 },
      { name: 'Hybrid', value: 51420 },
    ],
    performance: series(410000, 482350),
    holdings: [
      {
        id: 'fund-northwind',
        name: 'Northwind Large Cap Sample Fund',
        category: 'Equity · Large cap',
        invested: 180000,
        current: 214500,
        returns: 34500,
        returnsPct: 19.17,
        dayChange: 640,
        dayChangePct: 0.3,
      },
      {
        id: 'fund-deccan',
        name: 'Deccan Flexi Sample Fund',
        category: 'Equity · Flexi cap',
        invested: 120000,
        current: 141600,
        returns: 21600,
        returnsPct: 18,
        dayChange: 310,
        dayChangePct: 0.22,
      },
      {
        id: 'fund-malabar',
        name: 'Malabar Short Duration Sample Fund',
        category: 'Debt · Short duration',
        invested: 70000,
        current: 74830,
        returns: 4830,
        returnsPct: 6.9,
        dayChange: 70,
        dayChangePct: 0.09,
      },
      {
        id: 'fund-godavari',
        name: 'Godavari Hybrid Sample Fund',
        category: 'Hybrid · Aggressive',
        invested: 40000,
        current: 51420,
        returns: 11420,
        returnsPct: 28.55,
        dayChange: 220,
        dayChangePct: 0.43,
      },
    ],
    watchlist: [
      { id: 'stock-samplebank', name: 'Sample Bank Ltd', symbol: 'SMPLBANK', price: 842.5, changePct: 1.8 },
      { id: 'stock-orbitsoft', name: 'Orbitsoft Sample Ltd', symbol: 'ORBITS', price: 1264, changePct: -0.6 },
      { id: 'stock-rivergrid', name: 'Rivergrid Energy Sample', symbol: 'RGRID', price: 318.4, changePct: 2.4 },
      { id: 'stock-lotuschem', name: 'Lotuschem Sample Ltd', symbol: 'LOTUS', price: 590, changePct: 0.4 },
    ],
    transactions: [
      { id: 'tx-1', date: '2026-11-05', name: 'Northwind Large Cap Sample Fund', kind: 'SIP', amount: 5000, status: 'Simulated' },
      { id: 'tx-2', date: '2026-11-05', name: 'Deccan Flexi Sample Fund', kind: 'SIP', amount: 3000, status: 'Simulated' },
      { id: 'tx-3', date: '2026-10-16', name: 'Godavari Hybrid Sample Fund', kind: 'Lumpsum', amount: 40000, status: 'Simulated' },
      { id: 'tx-4', date: '2026-10-05', name: 'Northwind Large Cap Sample Fund', kind: 'SIP', amount: 5000, status: 'Simulated' },
    ],
    topFunds: [
      { id: 'fund-godavari', name: 'Godavari Hybrid Sample Fund', category: 'Hybrid', scenarioGainPct: 28.55 },
      { id: 'fund-northwind', name: 'Northwind Large Cap Sample Fund', category: 'Equity', scenarioGainPct: 19.17 },
      { id: 'fund-deccan', name: 'Deccan Flexi Sample Fund', category: 'Equity', scenarioGainPct: 18 },
      { id: 'fund-malabar', name: 'Malabar Short Duration Sample Fund', category: 'Debt', scenarioGainPct: 6.9 },
    ],
    popularStocks: [
      { id: 'stock-rivergrid', name: 'Rivergrid Energy Sample', symbol: 'RGRID', price: 318.4, changePct: 2.4 },
      { id: 'stock-samplebank', name: 'Sample Bank Ltd', symbol: 'SMPLBANK', price: 842.5, changePct: 1.8 },
      { id: 'stock-lotuschem', name: 'Lotuschem Sample Ltd', symbol: 'LOTUS', price: 590, changePct: 0.4 },
      { id: 'stock-orbitsoft', name: 'Orbitsoft Sample Ltd', symbol: 'ORBITS', price: 1264, changePct: -0.6 },
    ],
    marketOverview: [
      { id: 'index-sample50', name: 'Sample 50', level: 22480, changePct: 0.35 },
      { id: 'index-samplebank', name: 'Sample Bank', level: 49810, changePct: 0.58 },
      { id: 'index-samplemid', name: 'Sample Midcap', level: 51220, changePct: -0.22 },
    ],
    catalog: sampleInstruments.map((item) => ({
      id: item.id,
      name: item.name,
      kind: item.kind,
      hint: item.category,
    })),
  }
}
