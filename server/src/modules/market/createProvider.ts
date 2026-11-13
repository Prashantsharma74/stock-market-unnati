import { env } from '../../config/env'
import { logger } from '../../utils/logger'
import type { MarketDataProvider } from './market.provider'
import type { MarketStatus } from './market.types'
import { createInfowayProvider, infowayKeyMissingMessage, type InfowayFetch, type InfowaySocketFactory } from './providers/infoway.provider'
import { createMockProvider } from './providers/mock.provider'
import { createTrueDataProvider, trueDataUnverifiedMessage, type TrueDataSocketFactory } from './providers/truedata.provider'
import { createUnconfiguredProvider } from './providers/unconfigured.provider'

const adapterNotInstalledMessage = 'Market data adapter is not installed.'
const trueDataSecretsMissingMessage = 'TrueData username and password are not configured.'
const mockDisabledMessage = 'Mock market data is disabled in production.'

export type CreateProviderOptions = {
  nodeEnv?: 'development' | 'test' | 'production'
  provider?: 'none' | 'mock' | 'truedata' | 'infoway'
  mode?: MarketStatus['mode']
  username?: string
  password?: string
  apiKey?: string
  socketFactory?: TrueDataSocketFactory
  infowayFetch?: InfowayFetch
  infowaySocketFactory?: InfowaySocketFactory
}

function secretPresent(value: string) {
  return value.trim().length > 0
}

export function createMarketDataProvider(options: CreateProviderOptions = {}): MarketDataProvider {
  const nodeEnv = options.nodeEnv ?? env.NODE_ENV
  const provider = options.provider ?? env.MARKET_DATA_PROVIDER
  const mode = options.mode ?? env.MARKET_DATA_ENV
  const username = options.username ?? env.TRUEDATA_USERNAME
  const password = options.password ?? env.TRUEDATA_PASSWORD
  const apiKey = options.apiKey ?? env.INFOWAY_API_KEY

  if (provider === 'mock') {
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      return createMockProvider({ mode, nodeEnv })
    }
    logger.warn(mockDisabledMessage)
    return createUnconfiguredProvider({ mode, message: mockDisabledMessage })
  }

  if (provider === 'infoway') {
    if (secretPresent(apiKey)) {
      return createInfowayProvider({
        mode,
        apiKey,
        fetchImpl: options.infowayFetch,
        socketFactory: options.infowaySocketFactory,
      })
    }
    logger.warn(infowayKeyMissingMessage)
    return createUnconfiguredProvider({ mode, message: infowayKeyMissingMessage })
  }

  // Missing secrets stay unconfigured. Present secrets select the adapter, which
  // still does not open a socket until the official handshake is verified.
  if (provider === 'truedata') {
    if (secretPresent(username) && secretPresent(password)) {
      logger.warn(trueDataUnverifiedMessage)
      return createTrueDataProvider({
        mode,
        username,
        password,
        socketFactory: options.socketFactory,
      })
    }
    logger.warn(trueDataSecretsMissingMessage)
    return createUnconfiguredProvider({ mode, message: trueDataSecretsMissingMessage })
  }

  return createUnconfiguredProvider({ mode, message: adapterNotInstalledMessage })
}
