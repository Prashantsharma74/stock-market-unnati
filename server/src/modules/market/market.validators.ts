import { z } from 'zod'
import { marketExchanges } from './market.types'

export const symbolSchema = z
  .string()
  .trim()
  .regex(/^[A-Z0-9-]{1,20}$/, 'Use 1 to 20 letters, numbers, or hyphens')

export const exchangeSchema = z.enum(marketExchanges)

export const intervalSchema = z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'])

const searchSchema = z
  .string()
  .trim()
  .max(20)
  .regex(/^[A-Za-z0-9-]*$/, 'Use letters, numbers, or hyphens')
  .optional()

export const listStocksSchema = z.object({
  query: z.object({
    q: searchSchema,
    exchange: exchangeSchema.optional(),
  }),
})

export const stockQuoteSchema = z.object({
  params: z.object({
    symbol: symbolSchema,
  }),
  query: z.object({
    exchange: exchangeSchema,
  }),
})

export const historySchema = z.object({
  params: z.object({
    symbol: symbolSchema,
  }),
  query: z.object({
    exchange: exchangeSchema,
    interval: intervalSchema,
  }),
})

export const subscriptionPayloadSchema = z.object({
  symbol: symbolSchema,
  exchange: exchangeSchema,
})

export const indiaCatalogSchema = z.object({
  query: z.object({
    q: z
      .string()
      .trim()
      .max(40)
      .regex(/^[A-Za-z0-9- ]*$/)
      .optional(),
    offset: z.coerce.number().int().min(0).max(50_000).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    indices: z.enum(['0', '1']).optional(),
  }),
})
