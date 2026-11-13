import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'

export type VerificationStatus = 'not_started' | 'pending' | 'verified'

export interface ProfileEntity {
  user: mongoose.Types.ObjectId
  fullName: string
  mobile: string
  dateOfBirth: Date
  panStatus: VerificationStatus
  kycStatus: VerificationStatus
  createdAt: Date
  updatedAt: Date
}

const profileSchema = new Schema<ProfileEntity>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    // Status only. The MVP does not collect PAN numbers or bank details.
    panStatus: { type: String, enum: ['not_started', 'pending', 'verified'], default: 'not_started', required: true },
    kycStatus: { type: String, enum: ['not_started', 'pending', 'verified'], default: 'not_started', required: true },
  },
  { timestamps: true },
)

export type ProfileDoc = HydratedDocument<ProfileEntity>
export const UserProfile: Model<ProfileEntity> = mongoose.model<ProfileEntity>('UserProfile', profileSchema)
