import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose'

export type NotificationKind = 'system' | 'market' | 'account'

export interface NotificationEntity {
  user: mongoose.Types.ObjectId
  title: string
  body: string
  kind: NotificationKind
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<NotificationEntity>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    kind: { type: String, enum: ['system', 'market', 'account'], default: 'system', required: true },
    read: { type: Boolean, default: false, required: true },
  },
  { timestamps: true },
)

notificationSchema.index({ user: 1, createdAt: -1 })

export type NotificationDoc = HydratedDocument<NotificationEntity>
export const Notification: Model<NotificationEntity> = mongoose.model<NotificationEntity>('Notification', notificationSchema)
