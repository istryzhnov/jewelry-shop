export type PricingSettings = { markupPercent?: number | null; roundTo?: number | null }

// Retail price from supplier cost: apply markup, round up to a step (e.g. 10 грн)
export function retailPrice(cost: number, { markupPercent, roundTo }: PricingSettings): number {
  const raw = cost * (1 + (markupPercent ?? 0) / 100)
  const step = roundTo && roundTo > 1 ? roundTo : 1
  return Math.ceil(Math.round(raw * 100) / 100 / step) * step
}
