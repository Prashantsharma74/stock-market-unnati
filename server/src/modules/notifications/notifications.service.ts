import { AppError } from '../../common/AppError'
import { Notification } from '../../models/Notification'

export async function listNotifications(userId: string) {
  const [items, unreadCount] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ user: userId, read: false }),
  ])

  return {
    unreadCount,
    items: items.map((item) => ({
      id: String(item._id),
      title: item.title,
      body: item.body,
      kind: item.kind,
      read: item.read,
      createdAt: new Date(item.createdAt).toISOString(),
    })),
  }
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const updated = await Notification.updateOne({ _id: notificationId, user: userId }, { $set: { read: true } })
  if (!updated.matchedCount) throw new AppError('Notification not found', 404, 'NOT_FOUND')
}

export async function markAllNotificationsRead(userId: string) {
  await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } })
}
