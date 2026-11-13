import type { Response } from 'express'
import { env } from '../config/env'

const secure = env.NODE_ENV === 'production'

function ttlToMs(ttl: string) {
  const match = /^(\d+)([smhd])$/.exec(ttl)
  if (!match) return 15 * 60 * 1000
  const amount = Number(match[1])
  const unit = match[2] as 's' | 'm' | 'h' | 'd'
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return amount * multipliers[unit]
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('finora_access', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: ttlToMs(env.ACCESS_TOKEN_TTL),
  })
  res.cookie('finora_refresh', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
  })
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('finora_access', { path: '/', sameSite: 'lax', secure })
  res.clearCookie('finora_refresh', { path: '/api/auth', sameSite: 'lax', secure })
}
