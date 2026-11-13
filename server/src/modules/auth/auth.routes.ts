import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { authLimiter } from '../../middleware/rateLimit'
import { validate } from '../../middleware/validate'
import * as authController from './auth.controller'
import { emailOnlySchema, loginSchema, registerSchema, resetPasswordSchema, verifyEmailSchema } from './auth.validators'

export const authRouter = Router()

authRouter.use(authLimiter)
authRouter.post('/register', validate(registerSchema), authController.register)
authRouter.post('/login', validate(loginSchema), authController.login)
authRouter.post('/refresh', authController.refresh)
authRouter.post('/logout', authController.logout)
authRouter.get('/me', requireAuth, authController.me)
authRouter.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail)
authRouter.post('/resend-verification', validate(emailOnlySchema), authController.resendVerification)
authRouter.post('/forgot-password', validate(emailOnlySchema), authController.forgotPassword)
authRouter.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword)
authRouter.get('/dev/mailbox', authController.devMailbox)
