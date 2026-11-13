import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiError, api, fieldErrors } from '../../lib/api.ts'
import type { PublicUser } from '../../types/models.ts'

type AuthError = { message: string; code?: string }

type AuthState = {
  user: PublicUser | null
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

const initialState: AuthState = {
  user: null,
  status: 'loading',
  error: null,
}

export const loadSession = createAsyncThunk<PublicUser | null, void, { rejectValue: string }>(
  'auth/session',
  async (_, { rejectWithValue }) => {
    try {
      return await api<PublicUser>('/api/auth/me')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      return rejectWithValue(error instanceof ApiError ? error.message : 'Unable to reach Unnati')
    }
  },
)

export const login = createAsyncThunk<PublicUser, { email: string; password: string }, { rejectValue: AuthError }>(
  'auth/login',
  async (input, { rejectWithValue }) => {
    try {
      return await api<PublicUser>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    } catch (error) {
      if (error instanceof ApiError) return rejectWithValue({ message: error.message, code: error.code })
      return rejectWithValue({ message: 'Unable to reach Unnati' })
    }
  },
)

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api<{ loggedOut: boolean }>('/api/auth/logout', { method: 'POST' })
  } catch {
    // Clearing the local session is still the right outcome if the network call fails.
  }
})

export const updateProfile = createAsyncThunk<
  PublicUser,
  { fullName: string; mobile: string; dateOfBirth: string },
  { rejectValue: { message: string; fields: Record<string, string> } }
>('auth/profile', async (input, { rejectWithValue }) => {
  try {
    return await api<PublicUser>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  } catch (error) {
    return rejectWithValue({
      message: error instanceof ApiError ? error.message : 'Unable to save your profile',
      fields: fieldErrors(error),
    })
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.status = 'ready'
        state.user = action.payload
      })
      .addCase(loadSession.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload ?? 'Unable to reach Unnati'
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'ready'
        state.user = action.payload
        state.error = null
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.status = 'ready'
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
  },
})

export const authReducer = authSlice.reducer
