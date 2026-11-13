export type VerificationStatus = 'not_started' | 'pending' | 'verified'

export type PublicUser = {
  id: string
  fullName: string
  email: string
  mobile: string
  dateOfBirth: string
  role: 'user' | 'admin'
  emailVerified: boolean
  panStatus: VerificationStatus
  kycStatus: VerificationStatus
  createdAt: string
}

export type CatalogItem = {
  id: string
  name: string
  kind: 'fund' | 'stock' | 'index'
  hint: string
}

export type DashboardSnapshot = {
  dataSource: 'simulated'
  datasetId: string
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
  catalog: CatalogItem[]
}

export type InstrumentDetail = {
  id: string
  name: string
  kind: 'fund' | 'stock' | 'index'
  category: string
  summary: string
  metrics: { label: string; value: string }[]
  series: { month: string; value: number }[]
  dataSource: 'simulated'
  disclaimer: string
  note: string
}

export type AppNotification = {
  id: string
  title: string
  body: string
  kind: 'system' | 'market' | 'account'
  read: boolean
  createdAt: string
}

export type NotificationList = {
  unreadCount: number
  items: AppNotification[]
}

export type DevEmail = {
  id: string
  to: string
  subject: string
  text: string
  createdAt: string
}
