import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { toPublicUser } from './user.presenter'
import { asyncHandler } from '../../common/asyncHandler'
import { sendSuccess } from '../../common/apiResponse'
import * as usersController from './users.controller'
import { changePasswordSchema, updateProfileSchema } from './users.validators'

export const usersRouter = Router()

usersRouter.use(requireAuth)
usersRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    sendSuccess(res, await toPublicUser(req.user!.id))
  }),
)
usersRouter.patch('/me', validate(updateProfileSchema), usersController.updateProfile)
usersRouter.post('/me/password', validate(changePasswordSchema), usersController.changePassword)
