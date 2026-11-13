import { z } from 'zod'
import { dobSchema, fullNameSchema, mobileSchema, passwordSchema } from '../auth/auth.validators'

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: fullNameSchema,
    mobile: mobileSchema,
    dateOfBirth: dobSchema,
  }),
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
  }),
})
