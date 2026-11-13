import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks.ts'
import { logout } from '../../features/auth/authSlice.ts'
import { Logo } from '../brand/Logo.tsx'

const linkClass = 'inline-block text-ink/75 transition duration-200 hover:translate-x-0.5 hover:text-brand'

type FooterLink = {
  label: string
  to: string
  onClick?: () => void
}

export function SiteFooter() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)

  const accountLinks = useMemo((): FooterLink[] => {
    if (user) {
      return [
        { label: 'Profile', to: '/app/profile' },
        {
          label: 'Sign out',
          to: '#',
          onClick: () => {
            void dispatch(logout()).then(() => navigate('/login'))
          },
        },
      ]
    }
    return [
      { label: 'Sign in', to: '/login' },
      { label: 'Create account', to: '/register' },
      { label: 'Forgot password', to: '/forgot-password' },
    ]
  }, [dispatch, navigate, user])

  return (
    <footer className="mt-auto border-t border-line bg-paper pb-24 text-ink md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-ink/65">
            Unnati is a demonstration workspace. Sample prices are not from an exchange, and the app does not place orders or
            accept money.
          </p>
        </div>
        <FooterColumn
          title="Products"
          links={[
            { label: 'Stocks', to: '/app/stocks/explore' },
            { label: 'Mutual funds', to: '/app/funds/explore' },
            { label: 'F&O', to: '/app/fo/explore' },
            { label: 'Market feed', to: '/app/market' },
            { label: 'Watchlist', to: '/app/stocks/watchlist' },
          ]}
        />
        <FooterColumn
          title="Tools"
          links={[
            { label: 'SIP calculator', to: '/app/calculators' },
            { label: 'Learn', to: '/app/learn' },
            { label: 'Fund dashboard', to: '/app/funds/dashboard' },
            { label: 'SIPs', to: '/app/funds/sips' },
            { label: 'Orders', to: '/app/stocks/orders' },
          ]}
        />
        <FooterColumn title="Account" links={accountLinks} />
      </div>
      <div className="border-t border-line bg-white/50 px-4 py-4 text-center text-xs leading-5 text-ink/55">
        Unnati does not provide brokerage services and does not collect PAN or bank details. Figures are simulated for the
        interface only.
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            {link.onClick ? (
              <button type="button" onClick={link.onClick} className={`${linkClass} text-left`}>
                {link.label}
              </button>
            ) : (
              <Link to={link.to} className={linkClass}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
