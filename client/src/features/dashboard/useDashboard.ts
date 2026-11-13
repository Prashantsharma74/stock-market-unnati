import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks.ts'
import { fetchDashboard } from './dashboardSlice.ts'

export function useDashboardData() {
  const dispatch = useAppDispatch()
  const dashboard = useAppSelector((state) => state.dashboard)

  useEffect(() => {
    if (dashboard.status === 'idle') void dispatch(fetchDashboard())
  }, [dashboard.status, dispatch])

  return dashboard
}
