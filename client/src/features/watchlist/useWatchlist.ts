import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks.ts'
import { useDashboardData } from '../dashboard/useDashboard.ts'
import { hydrateWatchlist, toggleFund, toggleStock } from './watchlistSlice.ts'

export function useWatchlist() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const watch = useAppSelector((state) => state.watchlist)
  const dashboard = useDashboardData()

  useEffect(() => {
    if (!user || !dashboard.snapshot) return
    dispatch(
      hydrateWatchlist({
        userId: user.id,
        defaultStockIds: dashboard.snapshot.watchlist.map((item) => item.id),
      }),
    )
  }, [user, dashboard.snapshot, dispatch])

  useEffect(() => {
    if (!watch.userId) return
    localStorage.setItem(
      `finora.watch.${watch.userId}`,
      JSON.stringify({ stockIds: watch.stockIds, fundIds: watch.fundIds }),
    )
  }, [watch])

  return {
    watch,
    ready: Boolean(watch.userId),
    addStock: (id: string) => dispatch(toggleStock(id)),
    addFund: (id: string) => dispatch(toggleFund(id)),
  }
}
