import type { RequestHandler } from 'express'
import { asyncHandler } from '../../common/asyncHandler'
import { sendSuccess } from '../../common/apiResponse'
import { clearAuthCookies } from '../../utils/cookies'
import * as usersService from './users.service'

export const updateProfile: RequestHandler = asyncHandler(async (req, res) => {
  const user = await usersService.updateProfile(req.user!.id, req.body, req.ip)
  sendSuccess(res, user, 'Profile updated')
})

export const changePassword: RequestHandler = asyncHandler(async (req, res) => {
  await usersService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword, req.ip)
  clearAuthCookies(res)
  sendSuccess(res, { passwordChanged: true }, 'Password updated. Sign in again with the new password.')
})
