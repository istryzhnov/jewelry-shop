import type { ProductFilters, SortKey } from './catalog'

export type SearchParams = Record<string, string | string[] | undefined>

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

const positiveInt = (v: string | undefined) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
}

const SORT_KEYS: SortKey[] = ['new', 'price-asc', 'price-desc']

export function parseCatalogParams(params: SearchParams): ProductFilters {
  const sort = first(params.sort) as SortKey
  return {
    q: first(params.q)?.trim().slice(0, 100) || undefined,
    minPrice: positiveInt(first(params.min)),
    maxPrice: positiveInt(first(params.max)),
    inStock: first(params.stock) === '1',
    sort: SORT_KEYS.includes(sort) ? sort : 'new',
    page: positiveInt(first(params.page)) ?? 1,
  }
}

export function withParams(
  path: string,
  params: SearchParams,
  changes: Record<string, string | number | undefined>,
) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const v = first(value)
    if (v) query.set(key, v)
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined || value === '') query.delete(key)
    else query.set(key, String(value))
  }
  const qs = query.toString()
  return qs ? `${path}?${qs}` : path
}
