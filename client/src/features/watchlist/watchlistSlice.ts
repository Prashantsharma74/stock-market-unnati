import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { logout } from '../auth/authSlice.ts'

type WatchState = {
  userId: string | null
  stockIds: string[]
  fundIds: string[]
}

const initialState: WatchState = {
  userId: null,
  stockIds: [],
  fundIds: [],
}

function storageKey(userId: string) {
  return `finora.watch.${userId}`
}

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    hydrateWatchlist(state, action: PayloadAction<{ userId: string; defaultStockIds: string[] }>) {
      if (state.userId === action.payload.userId) return
      const raw = localStorage.getItem(storageKey(action.payload.userId))
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { stockIds?: string[]; fundIds?: string[] }
          state.userId = action.payload.userId
          state.stockIds = parsed.stockIds ?? []
          state.fundIds = parsed.fundIds ?? []
          return
        } catch {
          // Fall through and seed a fresh list.
        }
      }
      state.userId = action.payload.userId
      state.stockIds = action.payload.defaultStockIds
      state.fundIds = []
    },
    toggleStock(state, action: PayloadAction<string>) {
      const id = action.payload
      state.stockIds = state.stockIds.includes(id) ? state.stockIds.filter((item) => item !== id) : [...state.stockIds, id]
    },
    toggleFund(state, action: PayloadAction<string>) {
      const id = action.payload
      state.fundIds = state.fundIds.includes(id) ? state.fundIds.filter((item) => item !== id) : [...state.fundIds, id]
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout.fulfilled, () => initialState)
  },
})

export const { hydrateWatchlist, toggleStock, toggleFund } = watchlistSlice.actions
export const watchlistReducer = watchlistSlice.reducer
