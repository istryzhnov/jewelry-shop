import { describe, expect, it } from 'vitest'

import { retailPrice } from '@/utilities/pricing'

describe('retailPrice', () => {
  it('applies markup and rounds up to the step', () => {
    expect(retailPrice(1210, { markupPercent: 30, roundTo: 10 })).toBe(1580)
    expect(retailPrice(1000, { markupPercent: 25, roundTo: 50 })).toBe(1250)
  })

  it('keeps cost when no markup is set', () => {
    expect(retailPrice(1210, {})).toBe(1210)
  })

  it('does not round up exact values because of float error', () => {
    expect(retailPrice(1000, { markupPercent: 10, roundTo: 10 })).toBe(1100)
  })
})
