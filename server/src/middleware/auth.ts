import type { RequestHandler } from 'express'
import { AppError } from '../common/AppError'
import type { UserRole } from '../models/User'
import { verifyAccessToken } from '../utils/tokens'

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  const token = bearer || req.cookies?.finora_access

  if (!token) {
    next(new AppError('Please sign in to continue', 401, 'UNAUTHENTICATED'))
    return
  }

  try {
    const claims = verifyAccessToken(token)
    req.user = { id: claims.sub, role: claims.role, email: claims.email }
    next()
  } catch {
    next(new AppError('Please sign in to continue', 401, 'UNAUTHENTICATED'))
  }
}

export const requireRole = (...roles: UserRole[]): RequestHandler => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    next(new AppError('You do not have access to this area', 403, 'FORBIDDEN'))
    return
  }
  next()
}
