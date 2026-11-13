import { AppError } from '../../common/AppError'
import { RefreshToken } from '../../models/RefreshToken'
import { User } from '../../models/User'
import { UserProfile } from '../../models/UserProfile'
import { recordAudit } from '../../services/audit.service'
import { normalizeMobile } from '../../utils/mobile'
import { hashPassword, verifyPassword } from '../../utils/password'
import { toPublicUser } from './user.presenter'

export async function updateProfile(
  userId: string,
  input: { fullName: string; mobile: string; dateOfBirth: string },
  ip?: string,
) {
  const profile = await UserProfile.findOne({ user: userId })
  if (!profile) throw new AppError('Profile not found', 404, 'PROFILE_MISSING')

  profile.fullName = input.fullName.trim()
  profile.mobile = normalizeMobile(input.mobile)
  profile.dateOfBirth = new Date(`${input.dateOfBirth}T00:00:00.000Z`)
  await profile.save()
  await recordAudit({ actorId: userId, action: 'user.profile_update', ip })
  return toPublicUser(userId)
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string, ip?: string) {
  const user = await User.findById(userId).select('+passwordHash')
  if (!user) throw new AppError('Account not found', 404, 'NOT_FOUND')

  const matches = await verifyPassword(currentPassword, user.passwordHash)
  if (!matches) throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD')

  user.passwordHash = await hashPassword(newPassword)
  await user.save()
  await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } })
  await recordAudit({ actorId: userId, action: 'user.password_change', ip })
}
