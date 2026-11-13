import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../common/AppError'
import { logger } from '../utils/logger'

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof SyntaxError && 'status' in error && (error as { status?: number }).status === 400) {
    res.status(400).json({
      success: false,
      message: 'Request body must be valid JSON',
      code: 'INVALID_JSON',
    })
    return
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(error.details ? { errors: error.details } : {}),
    })
    return
  }

  if (typeof error === 'object' && error && 'code' in error && (error as { code?: number }).code === 11000) {
    res.status(409).json({
      success: false,
      message: 'An account with this email already exists',
      code: 'DUPLICATE',
    })
    return
  }

  logger.error('Unhandled request error', {
    method: req.method,
    path: req.path,
    message: error instanceof Error ? error.message : 'Unknown error',
  })

  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.',
    code: 'INTERNAL_ERROR',
  })
}
