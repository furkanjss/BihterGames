/** Parse Turkish-formatted money: 100.000.000 or 100.000,50 → number */
export function parseMoney(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, '')
  if (!cleaned) return NaN
  // last comma = decimal separator if present
  if (cleaned.includes(',')) {
    const [whole, frac = ''] = cleaned.split(',')
    const intPart = whole.replace(/\./g, '')
    return Number(`${intPart}.${frac.replace(/\D/g, '')}`)
  }
  return Number(cleaned.replace(/\./g, ''))
}

/** Format integer/digits with TR thousand dots while typing */
export function formatMoneyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  // avoid leading zeros clutter (keep single 0)
  const normalized = digits.replace(/^0+(?=\d)/, '')
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Display: 100.000.000 ₺ */
export function formatMoney(n: number, currency = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}
