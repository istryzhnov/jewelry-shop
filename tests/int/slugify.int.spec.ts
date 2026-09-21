import { describe, expect, it } from 'vitest'

import { slugify } from '@/utilities/slugify'

describe('slugify', () => {
  it('transliterates Ukrainian', () => {
    expect(slugify('Срібна каблучка з фіанітом')).toBe('sribna-kabluchka-z-fianitom')
    expect(slugify('Щастя')).toBe('shchastia')
  })

  it('uses word-start forms for є ї й ю я', () => {
    expect(slugify('Юлія')).toBe('yuliia')
    expect(slugify('Їжак')).toBe('yizhak')
    expect(slugify('Яблуко й ягода')).toBe('yabluko-y-yahoda')
  })

  it('handles зг and apostrophes', () => {
    expect(slugify('Згорани')).toBe('zghorany')
    expect(slugify("Подвір'я")).toBe('podviria')
  })

  it('keeps latin and digits, collapses separators', () => {
    expect(slugify('  Кільце  Gold 585 / №2 ')).toBe('kiltse-gold-585-2')
  })

  it('returns undefined for empty input', () => {
    expect(slugify('')).toBeUndefined()
    expect(slugify(undefined)).toBeUndefined()
  })
})
