export function formatInr(value: number) {
  const digits = Number.isInteger(value) ? 0 : 2
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

/** Short INR for tight UI (lakhs / crores). Full figure still available via formatInr. */
export function formatInrCompact(value: number) {
  const rounded = Math.round(value)
  const abs = Math.abs(rounded)
  const sign = rounded < 0 ? '−' : ''
  if (abs >= 1_00_00_000) {
    const crores = abs / 1_00_00_000
    const digits = crores >= 100 ? 0 : crores >= 10 ? 1 : 2
    return `${sign}₹${crores.toFixed(digits)} Cr`
  }
  if (abs >= 1_00_000) {
    const lakhs = abs / 1_00_000
    const digits = lakhs >= 100 ? 0 : lakhs >= 10 ? 1 : 2
    return `${sign}₹${lakhs.toFixed(digits)} L`
  }
  return formatInr(rounded)
}

export function formatPct(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatMobile(mobile: string) {
  if (mobile.length !== 10) return mobile
  return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`
}

export function toneForChange(value: number) {
  if (value > 0) return 'text-emerald-700'
  if (value < 0) return 'text-rose-700'
  return 'text-slate-600'
}

export function maxAdultDob() {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
