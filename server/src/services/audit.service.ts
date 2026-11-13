import { AuditLog } from '../models/AuditLog'

export async function recordAudit(entry: {
  actorId?: string
  action: string
  ip?: string
  meta?: Record<string, unknown>
}) {
  await AuditLog.create({
    actor: entry.actorId,
    action: entry.action,
    ip: entry.ip,
    meta: entry.meta ?? {},
  })
}
