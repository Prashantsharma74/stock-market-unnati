import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { env } from './env'
import { logger } from '../utils/logger'

let memoryServer: MongoMemoryServer | null = null

export async function connectDb() {
  let uri = env.MONGODB_URI

  if (uri === 'memory') {
    memoryServer = await MongoMemoryServer.create()
    uri = memoryServer.getUri('finora')
    logger.warn('Using an in-memory MongoDB. Accounts and mail are wiped when the API stops.')
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  logger.info('Database connected')
}

export async function disconnectDb() {
  await mongoose.disconnect()
  if (memoryServer) {
    await memoryServer.stop()
    memoryServer = null
  }
}
