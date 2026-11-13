import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiError, api } from '../../lib/api.ts'
import type { DashboardSnapshot } from '../../types/models.ts'

type DashboardState = {
  snapshot: DashboardSnapshot | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
}

const initialState: DashboardState = {
  snapshot: null,
  status: 'idle',
  error: null,
}

export const fetchDashboard = createAsyncThunk<DashboardSnapshot, void, { rejectValue: string }>(
  'dashboard/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await api<DashboardSnapshot>('/api/dashboard')
    } catch (error) {
      return rejectWithValue(error instanceof ApiError ? error.message : 'Unable to load the dashboard')
    }
  },
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.status = 'ready'
        state.snapshot = action.payload
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Unable to load the dashboard'
      })
  },
})

export const dashboardReducer = dashboardSlice.reducer
