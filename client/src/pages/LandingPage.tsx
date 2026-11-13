import { useEffect } from 'react'
import { useAppSelector } from '../app/hooks.ts'
import { GrowwHome } from '../components/landing/GrowwHome.tsx'

export function LandingPage() {
  const user = useAppSelector((state) => state.auth.user)
  const enter = user ? '/app/stocks/explore' : '/login'

  useEffect(() => {
    document.title = 'Unnati — Invest in everything'
  }, [])

  return <GrowwHome enter={enter} />
}
