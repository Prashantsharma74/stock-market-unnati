import { Link } from 'react-router-dom'

export function Logo({
  tone = 'dark',
  to = '/',
  size = 'md',
}: {
  tone?: 'dark' | 'light'
  to?: string
  size?: 'md' | 'lg'
}) {
  const height = size === 'lg' ? 'h-14' : 'h-11'
  const chip = tone === 'light' ? 'rounded-lg bg-white px-2.5 py-1.5' : ''

  return (
    <Link to={to} className="group inline-flex shrink-0 items-center">
      <span className={`inline-flex ${chip}`}>
        <img
          src="/unnati-logo.png"
          alt="Unnati"
          className={`${height} w-auto origin-left transition duration-300 group-hover:scale-[1.03]`}
        />
      </span>
    </Link>
  )
}
