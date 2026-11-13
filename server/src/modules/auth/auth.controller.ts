import type { RequestHandler } from 'express'
import { parseLimit, parsePage } from '../../common/pagination'
import { sendSuccess } from '../../common/apiResponse'
import { asyncHandler } from '../../common/asyncHandler'
import { AppError } from '../../common/AppError'
import { env } from '../../config/env'
import { EmailMessage } from '../../models/EmailMessage'
import { clearAuthCookies, setAuthCookies } from '../../utils/cookies'
import { toPublicUser } from '../users/user.presenter'
import * as authService from './auth.service'

function meta(req: { ip?: string; get: (name: string) => string | undefined }) {
  return { ip: req.ip, userAgent: req.get('user-agent') }
}

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, req.ip)
  const message =
    result.emailDelivery === 'dev-mailbox'
      ? 'Account created. Open the development mailbox to confirm your email.'
      : 'Account created. Email delivery is not configured on this server yet, so the confirmation link cannot be sent.'
  sendSuccess(res, result, message, 201)
})

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const session = await authService.login(req.body, meta(req))
  setAuthCookies(res, session.accessToken, session.refreshToken)
  sendSuccess(res, session.user, 'Signed in')
})

export const refresh: RequestHandler = asyncHandler(async (req, res) => {
  const tokens = await authService.refreshSession(req.cookies?.finora_refresh, meta(req))
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken)
  sendSuccess(res, { refreshed: true })
})

export const logout: RequestHandler = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.finora_refresh, req.ip)
  clearAuthCookies(res)
  sendSuccess(res, { loggedOut: true })
})

export const me: RequestHandler = asyncHandler(async (req, res) => {
  sendSuccess(res, await toPublicUser(req.user!.id))
})

export const verifyEmail: RequestHandler = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body.token, req.ip)
  sendSuccess(res, { verified: true }, 'Email confirmed. You can sign in.')
})

export const resendVerification: RequestHandler = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.body.email, req.ip)
  sendSuccess(res, { accepted: true }, 'If the account still needs confirmation, a new link has been created.')
})

export const forgotPassword: RequestHandler = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email, req.ip)
  const message =
    env.NODE_ENV === 'production'
      ? 'If an account exists for that email, a reset link is on its way.'
      : 'If an account exists for that email, the reset link is in the development mailbox.'
  sendSuccess(res, { accepted: true }, message)
})

export const resetPassword: RequestHandler = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password, req.ip)
  sendSuccess(res, { reset: true }, 'Password updated. Sign in with the new password.')
})

export const devMailbox: RequestHandler = asyncHandler(async (req, res) => {
  if (env.NODE_ENV === 'production') {
    throw new AppError('Not found', 404, 'NOT_FOUND')
  }

  const page = parsePage(req.query.page)
  const limit = parseLimit(req.query.limit)
  const email = typeof req.query.email === 'string' ? req.query.email.toLowerCase() : undefined
  const filter = email ? { to: email } : {}
  const [items, total] = await Promise.all([
    EmailMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    EmailMessage.countDocuments(filter),
  ])

  sendSuccess(
    res,
    items.map((item) => ({
      id: String(item._id),
      to: item.to,
      subject: item.subject,
      text: item.text,
      createdAt: new Date(item.createdAt).toISOString(),
    })),
    undefined,
    200,
    { page, limit, total },
  )
})
