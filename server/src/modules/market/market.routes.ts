import { Router } from 'express'
import { sendSuccess } from '../../common/apiResponse'
import { AppError } from '../../common/AppError'
import { asyncHandler } from '../../common/asyncHandler'
import { requireAuth } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { isMarketExchange, type CandleInterval, type MarketExchange } from './market.types'
import { feedServesQuotes } from './redisQuotes'
import { getMarketRuntime, type MarketRuntime } from './market.service'
import { historySchema, indiaCatalogSchema, listStocksSchema, stockQuoteSchema } from './market.validators'

function asExchange(value: unknown): MarketExchange {
  if (typeof value === 'string' && isMarketExchange(value)) return value
  throw new AppError('Check the highlighted fields', 400, 'VALIDATION_ERROR')
}

function asInterval(value: unknown): CandleInterval {
  if (value === '1D' || value === '1W' || value === '1M' || value === '3M' || value === '6M' || value === '1Y' || value === '5Y') {
    return value
  }
  throw new AppError('Check the highlighted fields', 400, 'VALIDATION_ERROR')
}

export function createMarketRouter(runtime: MarketRuntime = getMarketRuntime()) {
  const router = Router()

  router.use(requireAuth)

  router.get(
    '/health',
    asyncHandler(async (_req, res) => {
      const status = runtime.getHealth()
      sendSuccess(res, {
        provider: status.provider,
        mode: status.mode,
        connection: status.connection,
        configured: status.configured,
        message: status.message,
        checkedAt: status.checkedAt,
      })
    }),
  )

  router.get(
    '/stocks',
    validate(listStocksSchema),
    asyncHandler(async (req, res) => {
      const exchange = req.query.exchange === undefined ? undefined : asExchange(req.query.exchange)
      const q = typeof req.query.q === 'string' ? req.query.q : undefined
      sendSuccess(res, await runtime.listStocks({ q, exchange }))
    }),
  )

  router.get(
    '/stocks/explore',
    asyncHandler(async (_req, res) => {
      sendSuccess(res, await runtime.listExploreStocks())
    }),
  )

  router.get(
    '/symbols/india',
    validate(indiaCatalogSchema),
    asyncHandler(async (req, res) => {
      const q = typeof req.query.q === 'string' ? req.query.q : undefined
      const offset = Number(req.query.offset)
      const limit = Number(req.query.limit)
      const includeIndices = req.query.indices === '1'
      sendSuccess(
        res,
        await runtime.listIndiaSymbolCatalog({
          q,
          offset: Number.isFinite(offset) ? offset : 0,
          limit: Number.isFinite(limit) ? limit : 50,
          includeIndices,
        }),
      )
    }),
  )

  router.get(
    '/indices',
    asyncHandler(async (_req, res) => {
      sendSuccess(res, await runtime.listIndices())
    }),
  )

  router.get(
    '/stocks/:symbol/history',
    validate(historySchema),
    asyncHandler(async (req, res) => {
      sendSuccess(
        res,
        await runtime.getHistory(String(req.params.symbol), asExchange(req.query.exchange), asInterval(req.query.interval)),
      )
    }),
  )

  router.get(
    '/stocks/:symbol',
    validate(stockQuoteSchema),
    asyncHandler(async (req, res) => {
      const quote = await runtime.getStock(String(req.params.symbol), asExchange(req.query.exchange))
      if (!quote && !feedServesQuotes(runtime.getHealth())) {
        throw new AppError('Market data feed is not available', 503, 'MARKET_FEED_UNAVAILABLE')
      }
      sendSuccess(res, quote)
    }),
  )

  return router
}

export const marketRouter = createMarketRouter()
