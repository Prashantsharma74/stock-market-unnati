import { AppError } from '../../common/AppError'
import { env } from '../../config/env'
import { Notification } from '../../models/Notification'
import { RefreshToken } from '../../models/RefreshToken'
import { User, type UserDoc } from '../../models/User'
import { UserProfile } from '../../models/UserProfile'
import { recordAudit } from '../../services/audit.service'
import { sendEmail, type EmailChannel } from '../../services/email.service'
import { normalizeMobile } from '../../utils/mobile'
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from '../../utils/password'
import { hashToken, randomToken, signAccessToken } from '../../utils/tokens'
import { toPublicUser, type PublicUser } from '../users/user.presenter'
import type { LoginInput, RegisterInput } from './auth.validators'

const HOUR_MS = 60 * 60 * 1000

export type IssuedSession = {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * HOUR_MS)
}

async function issueTokens(user: UserDoc, meta: { ip?: string; userAgent?: string }) {
  const refreshToken = randomToken()
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    family: randomToken(),
    expiresAt: daysFromNow(env.REFRESH_TOKEN_TTL_DAYS),
    userAgent: meta.userAgent?.slice(0, 200),
    ip: meta.ip,
  })

  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role, email: user.email }),
    refreshToken,
  }
}

async function sendVerification(user: UserDoc) {
  const token = randomToken()
  await User.updateOne(
    { _id: user._id },
    {
      emailVerifyTokenHash: hashToken(token),
      emailVerifyExpires: new Date(Date.now() + 24 * HOUR_MS),
    },
  )

  return sendEmail({
    to: user.email,
    subject: 'Confirm your Unnati email',
    text: [
      'Confirm your email to sign in to Unnati.',
      '',
      `${env.CLIENT_ORIGIN}/verify-email?token=${token}`,
      '',
      'This link expires in 24 hours.',
      '',
      'Unnati is a demonstration product. It does not place investment orders or accept investment money.',
    ].join('\n'),
  })
}

export async function register(input: RegisterInput, ip?: string) {
  const email = input.email.toLowerCase()
  const existing = await User.findOne({ email })
  if (existing) throw new AppError('An account with this email already exists', 409, 'EMAIL_IN_USE')

  const user = await User.create({
    email,
    passwordHash: await hashPassword(input.password),
    role: 'user',
    emailVerified: false,
    isActive: true,
  })

  await UserProfile.create({
    user: user._id,
    fullName: input.fullName.trim(),
    mobile: normalizeMobile(input.mobile),
    dateOfBirth: new Date(`${input.dateOfBirth}T00:00:00.000Z`),
  })

  const delivery = await sendVerification(user)
  await Notification.create({
    user: user._id,
    title: 'Confirm your email',
    body: 'Verify your email before signing in. Prices and returns inside Unnati are simulated.',
    kind: 'account',
  })
  await recordAudit({ actorId: user.id, action: 'auth.register', ip, meta: { email } })

  return { email, emailDelivery: delivery.channel satisfies EmailChannel }
}

export async function login(input: LoginInput, meta: { ip?: string; userAgent?: string }): Promise<IssuedSession> {
  const email = input.email.toLowerCase()
  const user = await User.findOne({ email }).select('+passwordHash')
  const passwordMatches = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH)

  if (!user || !passwordMatches) {
    await recordAudit({ action: 'auth.login_failed', ip: meta.ip, meta: { email } })
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  if (!user.isActive) throw new AppError('This account is disabled', 403, 'ACCOUNT_DISABLED')
  if (!user.emailVerified) {
    throw new AppError('Confirm your email before signing in', 403, 'EMAIL_NOT_VERIFIED')
  }

  user.lastLoginAt = new Date()
  await user.save()

  const tokens = await issueTokens(user, meta)
  await recordAudit({ actorId: user.id, action: 'auth.login', ip: meta.ip })

  return { user: await toPublicUser(user.id), ...tokens }
}

export async function refreshSession(rawToken: string | undefined, meta: { ip?: string; userAgent?: string }) {
  if (!rawToken) throw new AppError('Session expired. Please sign in again.', 401, 'SESSION_EXPIRED')

  const existing = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) })
  if (!existing) throw new AppError('Session expired. Please sign in again.', 401, 'SESSION_EXPIRED')

  if (existing.revokedAt) {
    await RefreshToken.updateMany({ family: existing.family, revokedAt: null }, { $set: { revokedAt: new Date() } })
    await recordAudit({ actorId: String(existing.user), action: 'auth.refresh_reuse', ip: meta.ip })
    throw new AppError('Session expired. Please sign in again.', 401, 'SESSION_REUSE')
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    throw new AppError('Session expired. Please sign in again.', 401, 'SESSION_EXPIRED')
  }

  const user = await User.findById(existing.user)
  if (!user || !user.isActive) {
    throw new AppError('Session expired. Please sign in again.', 401, 'SESSION_EXPIRED')
  }

  const refreshToken = randomToken()
  const created = await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    family: existing.family,
    expiresAt: daysFromNow(env.REFRESH_TOKEN_TTL_DAYS),
    userAgent: meta.userAgent?.slice(0, 200),
    ip: meta.ip,
  })

  existing.revokedAt = new Date()
  existing.replacedBy = created._id
  await existing.save()

  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role, email: user.email }),
    refreshToken,
  }
}

export async function logout(rawToken: string | undefined, ip?: string) {
  if (!rawToken) return
  const existing = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) })
  if (!existing || existing.revokedAt) return
  existing.revokedAt = new Date()
  await existing.save()
  await recordAudit({ actorId: String(existing.user), action: 'auth.logout', ip })
}

export async function verifyEmail(token: string, ip?: string) {
  const user = await User.findOne({ emailVerifyTokenHash: hashToken(token) }).select('+emailVerifyTokenHash +emailVerifyExpires')
  if (!user || !user.emailVerifyExpires || user.emailVerifyExpires.getTime() < Date.now()) {
    throw new AppError('This confirmation link is invalid or has expired', 400, 'INVALID_TOKEN')
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { emailVerified: true }, $unset: { emailVerifyTokenHash: 1, emailVerifyExpires: 1 } },
  )
  await recordAudit({ actorId: user.id, action: 'auth.verify_email', ip })
}

export async function resendVerification(emailRaw: string, ip?: string) {
  const email = emailRaw.toLowerCase()
  const user = await User.findOne({ email })
  if (user && user.isActive && !user.emailVerified) {
    await sendVerification(user)
    await recordAudit({ actorId: user.id, action: 'auth.resend_verification', ip })
  }
}

export async function forgotPassword(emailRaw: string, ip?: string) {
  const email = emailRaw.toLowerCase()
  const user = await User.findOne({ email })
  if (user && user.isActive) {
    const token = randomToken()
    await User.updateOne(
      { _id: user._id },
      {
        passwordResetTokenHash: hashToken(token),
        passwordResetExpires: new Date(Date.now() + HOUR_MS),
      },
    )
    await sendEmail({
      to: email,
      subject: 'Reset your Unnati password',
      text: [
        'Reset your Unnati password by opening this link:',
        '',
        `${env.CLIENT_ORIGIN}/reset-password?token=${token}`,
        '',
        'This link expires in 1 hour. If you did not ask for a reset, you can ignore this message.',
      ].join('\n'),
    })
    await recordAudit({ actorId: user.id, action: 'auth.forgot_password', ip })
  }
}

export async function resetPassword(token: string, password: string, ip?: string) {
  const user = await User.findOne({ passwordResetTokenHash: hashToken(token) }).select(
    '+passwordResetTokenHash +passwordResetExpires',
  )
  if (!user || !user.passwordResetExpires || user.passwordResetExpires.getTime() < Date.now()) {
    throw new AppError('This reset link is invalid or has expired', 400, 'INVALID_TOKEN')
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: { passwordHash: await hashPassword(password) },
      $unset: { passwordResetTokenHash: 1, passwordResetExpires: 1 },
    },
  )
  await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } })
  await recordAudit({ actorId: user.id, action: 'auth.reset_password', ip })
}
