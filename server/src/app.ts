import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import mongoSanitize from 'express-mongo-sanitize'
import swaggerUi from 'swagger-ui-express'
import { env } from './config/env'
import { openApiSpec } from './docs/openapi'
import { integrationSnapshot } from './integrations/providers'
import { getMarketRuntime } from './modules/market/market.service'
import { errorHandler } from './middleware/errorHandler'
import { apiLimiter } from './middleware/rateLimit'
import { authRouter } from './modules/auth/auth.routes'
import { dashboardRouter } from './modules/dashboard/dashboard.routes'
import { marketRouter } from './modules/market/market.routes'
import { notificationsRouter } from './modules/notifications/notifications.routes'
import { usersRouter } from './modules/users/users.routes'
import { logger } from './utils/logger'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())
  app.use(mongoSanitize())
  app.use((req, res, next) => {
    const started = Date.now()
    const path = req.originalUrl.split('?')[0] ?? req.originalUrl
    res.on('finish', () => {
      if (!path.startsWith('/api')) return
      logger.info('request', {
        method: req.method,
        path,
        status: res.statusCode,
        ms: Date.now() - started,
      })
    })
    next()
  })

  app.use('/api', apiLimiter)
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'Unnati API' }))

  app.get('/api/health', (_req, res) => {
    const market = getMarketRuntime().getHealth()
    const marketDataLive = market.provider === 'infoway' && market.connection === 'connected' && market.configured
    res.json({
      success: true,
      data: {
        service: 'unnati-api',
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        marketData: marketDataLive ? 'live' : 'simulated',
        integrations: integrationSnapshot(marketDataLive),
      },
    })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/notifications', notificationsRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use('/api/market', marketRouter)

  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, message: 'Resource not found', code: 'NOT_FOUND' })
  })

  app.use(errorHandler)
  return app
}
