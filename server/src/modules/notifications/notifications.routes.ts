import { Router } from 'express'
import mongoose from 'mongoose'
import { asyncHandler } from '../../common/asyncHandler'
import { sendSuccess } from '../../common/apiResponse'
import { AppError } from '../../common/AppError'
import { requireAuth } from '../../middleware/auth'
import * as notificationsService from './notifications.service'

export const notificationsRouter = Router()

notificationsRouter.use(requireAuth)

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    sendSuccess(res, await notificationsService.listNotifications(req.user!.id))
  }),
)

notificationsRouter.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationsService.markAllNotificationsRead(req.user!.id)
    sendSuccess(res, { updated: true })
  }),
)

notificationsRouter.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    if (!mongoose.isValidObjectId(id)) throw new AppError('Notification not found', 404, 'NOT_FOUND')
    await notificationsService.markNotificationRead(req.user!.id, id)
    sendSuccess(res, { updated: true })
  }),
)
