import type { CurrencyCode } from './types'

export type RatesMap = Record<CurrencyCode, number>

const CACHE_KEY = 'bihter-fx-cache-v1'
const CACHE_MS = 60 * 60 * 1000

interface CachePayload {
  base: CurrencyCode
  rates: RatesMap
  fetchedAt: number
}

export async function fetchRates(base: CurrencyCode = 'TRY'): Promise<{
  rates: RatesMap
  fetchedAt: number
  cached: boolean
}> {
  const cached = readCache(base)
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) {
    return { rates: cached.rates, fetchedAt: cached.fetchedAt, cached: true }
  }

  const symbols = (['TRY', 'USD', 'EUR', 'GBP'] as CurrencyCode[])
    .filter((c) => c !== base)
    .join(',')

  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${base}&to=${symbols}`,
  )
  if (!res.ok) throw new Error('FX request failed')
  const json = (await res.json()) as { rates: Record<string, number> }

  const rates: RatesMap = {
    TRY: base === 'TRY' ? 1 : json.rates.TRY,
    USD: base === 'USD' ? 1 : json.rates.USD,
    EUR: base === 'EUR' ? 1 : json.rates.EUR,
    GBP: base === 'GBP' ? 1 : json.rates.GBP,
  }

  const fetchedAt = Date.now()
  writeCache({ base, rates, fetchedAt })
  return { rates, fetchedAt, cached: false }
}

export function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: RatesMap,
  base: CurrencyCode,
): number {
  if (from === to) return amount
  const inBase = from === base ? amount : amount / rates[from]
  return to === base ? inBase : inBase * rates[to]
}

function readCache(base: CurrencyCode): CachePayload | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachePayload
    if (parsed.base !== base || !parsed.rates) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(payload: CachePayload) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
}
