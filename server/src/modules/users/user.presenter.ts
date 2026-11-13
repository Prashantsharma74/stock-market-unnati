import { AppError } from '../../common/AppError'
import { User } from '../../models/User'
import { UserProfile, type VerificationStatus } from '../../models/UserProfile'

export type PublicUser = {
  id: string
  fullName: string
  email: string
  mobile: string
  dateOfBirth: string
  role: 'user' | 'admin'
  emailVerified: boolean
  panStatus: VerificationStatus
  kycStatus: VerificationStatus
  createdAt: string
}

export async function toPublicUser(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId)
  if (!user) throw new AppError('Account not found', 404, 'NOT_FOUND')

  const profile = await UserProfile.findOne({ user: user._id })
  if (!profile) throw new AppError('Profile not found', 404, 'PROFILE_MISSING')

  return {
    id: user.id,
    fullName: profile.fullName,
    email: user.email,
    mobile: profile.mobile,
    dateOfBirth: profile.dateOfBirth.toISOString().slice(0, 10),
    role: user.role,
    emailVerified: user.emailVerified,
    panStatus: profile.panStatus,
    kycStatus: profile.kycStatus,
    createdAt: user.createdAt.toISOString(),
  }
}
