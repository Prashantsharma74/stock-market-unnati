import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { UserRole } from '../models/User'

export type AccessClaims = {
  sub: string
  role: UserRole
  email: string
}

export function randomToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function signAccessToken(claims: AccessClaims) {
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string): AccessClaims {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET)
  if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    throw new Error('Invalid access token')
  }
  if (payload.role !== 'user' && payload.role !== 'admin') {
    throw new Error('Invalid access token')
  }
  return { sub: payload.sub, role: payload.role, email: payload.email }
}
