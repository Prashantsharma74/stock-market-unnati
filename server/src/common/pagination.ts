export function parsePage(value: unknown, fallback = 1) {
  const page = Number(value)
  if (!Number.isInteger(page) || page < 1) return fallback
  return page
}

export function parseLimit(value: unknown, fallback = 20, max = 50) {
  const limit = Number(value)
  if (!Number.isInteger(limit) || limit < 1) return fallback
  return Math.min(limit, max)
}
