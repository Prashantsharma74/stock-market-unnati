import rateLimit from 'express-rate-limit'
import { env } from '../config/env'

function tooMany(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please wait a moment and try again.',
    code: 'RATE_LIMITED',
  })
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'production' ? 300 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany,
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'production' ? 20 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany,
})
