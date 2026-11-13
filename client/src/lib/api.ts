export class ApiError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type ErrorBody = {
  success?: boolean
  message?: string
  code?: string
  errors?: unknown
}

type SuccessBody<T> = {
  success: true
  data: T
  message?: string
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

const skipRefresh = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/dev/mailbox',
])

let refreshTask: Promise<boolean> | null = null

async function refreshSession() {
  const response = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  return response.ok
}

export async function api<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })

  if (response.status === 401 && allowRefresh && !skipRefresh.has(path)) {
    refreshTask ??= refreshSession().finally(() => {
      refreshTask = null
    })
    const refreshed = await refreshTask
    if (refreshed) return api<T>(path, init, false)
  }

  const payload = (await response.json().catch(() => null)) as SuccessBody<T> | ErrorBody | null
  if (!response.ok || !payload || payload.success !== true || !('data' in payload)) {
    const message = payload && 'message' in payload && payload.message ? payload.message : 'Request failed'
    const code = payload && 'code' in payload ? payload.code : undefined
    const errors = payload && 'errors' in payload ? payload.errors : undefined
    throw new ApiError(message, response.status, code, errors)
  }

  return payload.data
}

export function fieldErrors(error: unknown) {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return {}
  const result: Record<string, string> = {}
  for (const issue of error.details) {
    if (!issue || typeof issue !== 'object' || !('path' in issue) || !('message' in issue)) continue
    const path = String(issue.path)
    const message = String(issue.message)
    if (path && !result[path]) result[path] = message
  }
  return result
}
