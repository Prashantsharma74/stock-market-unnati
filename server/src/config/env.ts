import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1).default('memory'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().regex(/^\d+[smhd]$/).default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(60).default(7),
  SEED_DEMO_DATA: z.enum(['true', 'false']).default('true'),
  // Server-only. Missing values use these defaults and must not be copied into VITE_ variables.
  MARKET_DATA_PROVIDER: z.enum(['none', 'mock', 'truedata', 'infoway']).default('none'),
  MARKET_DATA_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  TRUEDATA_USERNAME: z.string().default(''),
  TRUEDATA_PASSWORD: z.string().default(''),
  INFOWAY_API_KEY: z.string().default(''),
  /** Comma-separated NSE-style tickers for Explore (exchange IN). Overrides allowlist file when non-empty. */
  INFOWAY_EXPLORE_IN: z.string().default(''),
  /** Comma-separated US tickers for Explore. Overrides allowlist file when non-empty. */
  INFOWAY_EXPLORE_US: z.string().default(''),
  /** Optional path to infoway-allowlist.json. Default: server/data/infoway-allowlist.json */
  INFOWAY_EXPLORE_ALLOWLIST_PATH: z.string().default(''),
  TRUEDATA_REALTIME_URL: z.string().default(''),
  TRUEDATA_HISTORY_URL: z.string().default(''),
  REDIS_URL: z.string().default(''),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_ACCESS_SECRET.includes('dev-only')) {
  console.error('Refusing to start in production with a development JWT secret.')
  process.exit(1)
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.MONGODB_URI === 'memory') {
  console.error('Refusing to start in production with the in-memory database.')
  process.exit(1)
}

export const env = {
  ...parsed.data,
  seedDemoData: parsed.data.SEED_DEMO_DATA === 'true' && parsed.data.NODE_ENV !== 'production',
}
