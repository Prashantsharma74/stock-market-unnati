import { Bell, LogOut, Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks.ts'
import { Logo } from '../brand/Logo.tsx'
import { useDashboardData } from '../../features/dashboard/useDashboard.ts'
import { logout } from '../../features/auth/authSlice.ts'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../../features/notifications/notificationsSlice.ts'
import { useDismiss } from '../../lib/useDismiss.ts'
import { MarketTicker } from '../market/MarketTicker.tsx'
import { SiteFooter } from './SiteFooter.tsx'

const products = [
  { to: '/app/stocks/explore', label: 'Stocks', match: '/app/stocks' },
  { to: '/app/market', label: 'Market feed', match: '/app/market' },
  { to: '/app/fo/explore', label: 'F&O', match: '/app/fo' },
  { to: '/app/funds/explore', label: 'Mutual Funds', match: '/app/funds' },
]

const stockTabs = [
  { to: '/app/stocks/explore', label: 'Explore' },
  { to: '/app/stocks/holdings', label: 'Holdings' },
  { to: '/app/stocks/positions', label: 'Positions' },
  { to: '/app/stocks/orders', label: 'Orders' },
  { to: '/app/stocks/watchlist', label: 'Watchlist' },
]

const foTabs = [
  { to: '/app/fo/explore', label: 'Explore' },
  { to: '/app/fo/positions', label: 'Positions' },
  { to: '/app/fo/orders', label: 'Orders' },
]

const fundTabs = [
  { to: '/app/funds/explore', label: 'Explore' },
  { to: '/app/funds/dashboard', label: 'Dashboard' },
  { to: '/app/funds/sips', label: 'SIPs' },
  { to: '/app/funds/watchlist', label: 'Watchlist' },
]

function tabsFor(pathname: string) {
  if (pathname.startsWith('/app/funds')) return fundTabs
  if (pathname.startsWith('/app/fo')) return foTabs
  if (pathname.startsWith('/app/stocks') || pathname.startsWith('/app/instruments')) return stockTabs
  return []
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AppShell() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAppSelector((state) => state.auth.user)
  const notifications = useAppSelector((state) => state.notifications)
  const { snapshot } = useDashboardData()
  const [menuOpen, setMenuOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const menuRef = useDismiss<HTMLDivElement>(menuOpen, closeMenu)
  const tabs = tabsFor(pathname)

  useEffect(() => {
    if (notifications.status === 'idle') void dispatch(fetchNotifications())
  }, [notifications.status, dispatch])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col text-ink" data-app-shell>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
        <div className="relative z-40 mx-auto flex h-16 max-w-6xl items-center gap-4 bg-white px-4">
          <Logo to="/app/stocks/explore" />
          <NavLink
            to="/app/market"
            className={({ isActive }) =>
              `shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold md:hidden ${isActive ? 'bg-brand text-white' : 'text-brand'}`
            }
          >
            Market feed
          </NavLink>
          <nav className="hidden items-center gap-5 md:flex" aria-label="Products">
            {products.map((item) => {
              const active = pathname.startsWith(item.match)
              return (
                <NavLink key={item.to} to={item.to} className={`nav-link whitespace-nowrap text-sm transition-colors ${active ? 'font-semibold text-brand' : 'font-medium text-slate-600 hover:text-brand'}`}>
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
          <HeaderSearch catalog={snapshot?.catalog ?? []} />
          <button className="relative rounded-full p-2 text-slate-600 transition hover:bg-white hover:text-brand" aria-label="Notifications" onClick={() => setPanelOpen(true)}>
            <Bell size={18} />
            {notifications.unreadCount > 0 ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 animate-pulse place-items-center rounded-full bg-loss px-1 text-[10px] font-bold text-white">
                {notifications.unreadCount}
              </span>
            ) : null}
          </button>
          <div className="relative z-50" ref={menuRef}>
            <button
              className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-semibold text-white transition duration-200 hover:scale-105 hover:bg-brand-dark"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {initials(user.fullName)}
            </button>
            {menuOpen ? (
              <div
                className="absolute right-0 z-50 mt-2 w-60 origin-top-right animate-pop overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
                role="menu"
              >
                <div className="border-b border-slate-100 bg-white px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="bg-white p-1.5">
                  <NavLink
                    to="/app/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    role="menuitem"
                  >
                    Profile
                  </NavLink>
                  {user.role === 'admin' ? (
                    <NavLink
                      to="/app/admin"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                    >
                      Admin
                    </NavLink>
                  ) : null}
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-loss hover:bg-rose-50"
                    role="menuitem"
                    onClick={() => {
                      void dispatch(logout()).then(() => navigate('/login'))
                    }}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {tabs.length > 0 ? (
          <div className="relative z-0 mx-auto flex max-w-6xl gap-6 overflow-x-auto overflow-y-hidden bg-white px-4 [scrollbar-width:thin]">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `-mb-px shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors ${isActive ? 'border-gain text-ink' : 'border-transparent text-slate-500 hover:text-ink'}`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        ) : null}
        <div className="relative z-0">
          <MarketTicker paused={menuOpen} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:pb-10">
        <div key={pathname} className="animate-rise">
          <Outlet />
        </div>
      </main>
      <SiteFooter />

      {tabs.length > 0 ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper md:hidden" aria-label="Section">
          <ul className={`grid`} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => (
              <li key={tab.to}>
                <NavLink to={tab.to} className={({ isActive }) => `block py-3 text-center text-[11px] font-medium ${isActive ? 'text-brand' : 'text-slate-500'}`}>
                  {tab.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {panelOpen ? (
        <div className="fixed inset-0 z-40">
          <button className="absolute inset-0 bg-slate-900/30" aria-label="Close notifications" onClick={() => setPanelOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-drawer flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <button className="text-sm font-medium text-brand disabled:text-slate-300" disabled={notifications.unreadCount === 0} onClick={() => void dispatch(markAllNotificationsRead())}>
                Mark all read
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {notifications.items.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No notifications yet.</p> : null}
              {notifications.items.map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded-xl px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${item.read ? 'bg-white ring-1 ring-line' : 'bg-accent/10 ring-1 ring-accent/30'}`}
                  onClick={() => {
                    if (!item.read) void dispatch(markNotificationRead(item.id))
                  }}
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}

function HeaderSearch({ catalog }: { catalog: { id: string; name: string; kind: string; hint: string }[] }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const ref = useDismiss<HTMLDivElement>(open, close)
  const needle = query.trim().toLowerCase()
  const results = catalog.filter((item) => !needle || `${item.name} ${item.hint} ${item.kind}`.toLowerCase().includes(needle)).slice(0, 6)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative min-w-0 flex-1" ref={ref}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search Unnati"
        aria-label="Search sample instruments"
        className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-16 text-sm outline-none transition focus:border-brand focus:shadow-md focus:ring-2 focus:ring-brand/15"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[10px] text-slate-400 sm:block">Ctrl+K</kbd>
      {open ? (
        <div className="absolute z-30 mt-2 w-full animate-pop overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          {results.length === 0 ? <p className="px-4 py-3 text-sm text-slate-500">No sample instruments match.</p> : null}
          {results.map((item) => (
            <button
              key={item.id}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-accent/10 hover:text-brand"
              onClick={() => {
                setQuery('')
                setOpen(false)
                navigate(`/app/instruments/${item.id}`)
              }}
            >
              <span>
                <span className="block text-sm font-medium">{item.name}</span>
                <span className="block text-xs text-slate-500">{item.hint}</span>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.kind}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
