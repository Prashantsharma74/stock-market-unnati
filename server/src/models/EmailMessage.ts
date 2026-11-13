import mongoose, { Schema, type Model } from 'mongoose'

export interface EmailMessageEntity {
  to: string
  subject: string
  text: string
  createdAt: Date
  updatedAt: Date
}

const emailMessageSchema = new Schema<EmailMessageEntity>(
  {
    to: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true },
)

emailMessageSchema.index({ to: 1, createdAt: -1 })

export const EmailMessage: Model<EmailMessageEntity> = mongoose.model<EmailMessageEntity>('EmailMessage', emailMessageSchema)
