import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'

export type UserRole = 'user' | 'admin'

export interface UserEntity {
  email: string
  passwordHash: string
  role: UserRole
  emailVerified: boolean
  emailVerifyTokenHash?: string
  emailVerifyExpires?: Date
  passwordResetTokenHash?: string
  passwordResetExpires?: Date
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<UserEntity>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    emailVerified: { type: Boolean, default: false, required: true },
    emailVerifyTokenHash: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    isActive: { type: Boolean, default: true, required: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
)

userSchema.index({ emailVerifyTokenHash: 1 }, { sparse: true })
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true })

export type UserDoc = HydratedDocument<UserEntity>
export const User: Model<UserEntity> = mongoose.model<UserEntity>('User', userSchema)
