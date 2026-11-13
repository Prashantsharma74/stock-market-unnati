export function normalizeMobile(input: string) {
  const digits = input.replace(/\D/g, '')
  return digits.slice(-10)
}
