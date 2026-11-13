import { z } from 'zod'

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your full name')
  .max(80, 'Name is too long')
  .regex(/^[\p{L}][\p{L} .'-]*$/u, 'Use letters, spaces, apostrophes, or hyphens')

export const mobileSchema = z
  .string()
  .trim()
  .regex(/^(?:\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number')

export const dobSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date of birth')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)
    if (Number.isNaN(date.getTime())) return false
    const today = new Date()
    const adultCutoff = new Date(Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate()))
    return date.getTime() <= adultCutoff.getTime()
  }, 'You need to be at least 18 years old')

const emailSchema = z.string().trim().email('Enter a valid email address').max(120)

export const registerSchema = z.object({
  body: z.object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    mobile: mobileSchema,
    dateOfBirth: dobSchema,
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Enter your password'),
  }),
})

export const emailOnlySchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
})

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(20, 'Confirmation link is incomplete'),
  }),
})

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(20, 'Reset link is incomplete'),
    password: passwordSchema,
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>['body']
export type LoginInput = z.infer<typeof loginSchema>['body']
