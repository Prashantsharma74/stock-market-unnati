import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'

export interface RefreshTokenEntity {
  user: mongoose.Types.ObjectId
  tokenHash: string
  family: string
  expiresAt: Date
  revokedAt?: Date
  replacedBy?: mongoose.Types.ObjectId
  userAgent?: string
  ip?: string
  createdAt: Date
  updatedAt: Date
}

const refreshTokenSchema = new Schema<RefreshTokenEntity>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    replacedBy: Schema.Types.ObjectId,
    userAgent: String,
    ip: String,
  },
  { timestamps: true },
)

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export type RefreshTokenDoc = HydratedDocument<RefreshTokenEntity>
export const RefreshToken: Model<RefreshTokenEntity> = mongoose.model<RefreshTokenEntity>('RefreshToken', refreshTokenSchema)
