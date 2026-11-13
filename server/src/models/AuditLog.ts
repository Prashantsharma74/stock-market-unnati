import mongoose, { Schema, type Model } from 'mongoose'

export interface AuditLogEntity {
  actor?: mongoose.Types.ObjectId
  action: string
  ip?: string
  meta: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const auditLogSchema = new Schema<AuditLogEntity>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    ip: String,
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

auditLogSchema.index({ action: 1, createdAt: -1 })

export const AuditLog: Model<AuditLogEntity> = mongoose.model<AuditLogEntity>('AuditLog', auditLogSchema)
