import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiError, api } from '../../lib/api.ts'
import type { NotificationList } from '../../types/models.ts'

type NotificationState = NotificationList & {
  status: 'idle' | 'loading' | 'ready' | 'error'
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  status: 'idle',
}

export const fetchNotifications = createAsyncThunk<NotificationList, void, { rejectValue: string }>(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await api<NotificationList>('/api/notifications')
    } catch (error) {
      return rejectWithValue(error instanceof ApiError ? error.message : 'Unable to load notifications')
    }
  },
)

export const markNotificationRead = createAsyncThunk<string, string>('notifications/read', async (id) => {
  await api(`/api/notifications/${id}/read`, { method: 'PATCH' })
  return id
})

export const markAllNotificationsRead = createAsyncThunk('notifications/readAll', async () => {
  await api('/api/notifications/read-all', { method: 'POST' })
})

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'ready'
        state.items = action.payload.items
        state.unreadCount = action.payload.unreadCount
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.status = 'error'
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((entry) => entry.id === action.payload)
        if (item && !item.read) {
          item.read = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((item) => {
          item.read = true
        })
        state.unreadCount = 0
      })
  },
})

export const notificationsReducer = notificationsSlice.reducer
