import { BookOpen, Briefcase, Calculator, LayoutDashboard, LineChart, PieChart, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const primaryNav: NavItem[] = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/funds', label: 'Funds', icon: PieChart },
  { to: '/app/calculators', label: 'SIP', icon: Calculator },
  { to: '/app/stocks', label: 'Stocks', icon: LineChart },
  { to: '/app/portfolio', label: 'Portfolio', icon: Briefcase },
]

export const extraNav: NavItem[] = [
  { to: '/app/watchlist', label: 'Watchlist', icon: Star },
  { to: '/app/learn', label: 'Learn', icon: BookOpen },
]
