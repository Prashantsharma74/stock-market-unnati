import http from 'http'
import { createApp } from './app'
import { connectDb, disconnectDb } from './config/db'
import { env } from './config/env'
import { attachMarketDataSocket, bootMarketFeed, stopMarketData } from './modules/market/market.service'
import { seedDemoData } from './seed'
import { logger } from './utils/logger'

export function createHttpServer() {
  return http.createServer(createApp())
}

export let httpServer: http.Server | undefined

async function main() {
  await connectDb()
  if (env.seedDemoData) await seedDemoData()

  const server = createHttpServer()
  httpServer = server

  try {
    attachMarketDataSocket(server)
  } catch (error: unknown) {
    logger.error('Market socket failed to attach', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  await bootMarketFeed()

  server.listen(env.PORT, () => {
    logger.info('Unnati API listening', { port: env.PORT, docs: '/api/docs' })
  })

  const shutdown = async () => {
    try {
      await stopMarketData()
    } catch (error: unknown) {
      logger.error('Market feed failed to stop', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
    })
    await disconnectDb()
    process.exit(0)
  }

  process.on('SIGINT', () => {
    void shutdown()
  })
  process.on('SIGTERM', () => {
    void shutdown()
  })
}

main().catch((error: unknown) => {
  logger.error('Failed to start', { message: error instanceof Error ? error.message : 'Unknown error' })
  process.exit(1)
})
