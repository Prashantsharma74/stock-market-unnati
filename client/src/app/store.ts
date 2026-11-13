import { configureStore } from '@reduxjs/toolkit'
import { authReducer } from '../features/auth/authSlice.ts'
import { dashboardReducer } from '../features/dashboard/dashboardSlice.ts'
import { notificationsReducer } from '../features/notifications/notificationsSlice.ts'
import { watchlistReducer } from '../features/watchlist/watchlistSlice.ts'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    notifications: notificationsReducer,
    watchlist: watchlistReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
