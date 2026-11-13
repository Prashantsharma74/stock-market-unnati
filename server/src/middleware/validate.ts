import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../common/AppError'

export const validate = (schema: ZodType): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  })

  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.filter((part) => part !== 'body').join('.'),
      message: issue.message,
    }))
    next(new AppError('Check the highlighted fields', 400, 'VALIDATION_ERROR', issues))
    return
  }

  const data = result.data as { body?: unknown }
  if (data.body !== undefined) req.body = data.body
  next()
}
