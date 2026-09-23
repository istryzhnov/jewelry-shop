import { getPayload, Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { archiveMissing, planImport, TaxonomyCache, upsertRow } from '@/import/applyImport'
import type { PriceListRow } from '@/import/parsePriceList'
import config from '@/payload.config'
import { clearCatalog, seed } from '@/seed'

let payload: Payload

const row = (sku: string, costPrice: number, extra: Partial<PriceListRow> = {}): PriceListRow => ({
  sku,
  name: `Каблучка ${sku}`,
  slug: `kabluchka-${sku.toLowerCase()}`,
  type: 'ring',
  category: 'Каблучки',
  costPrice,
  cell: 'A1',
  ...extra,
})

async function runImport(rows: PriceListRow[]) {
  const taxonomy = await new TaxonomyCache(payload).load()
  const results = []
  for (const r of rows) results.push(await upsertRow(payload, r, taxonomy))
  const archived = await archiveMissing(payload, new Set(rows.map((r) => r.sku)))
  return { results, archived }
}

const bySku = async (sku: string) =>
  (
    await payload.find({
      collection: 'products',
      where: { 'variants.sku': { equals: sku } },
      depth: 0,
    })
  ).docs[0]

describe('price-list import', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await clearCatalog(payload)
    await seed(payload)
    await payload.updateGlobal({ slug: 'settings', data: { markupPercent: 20, roundTo: 10 } })
  })

  afterAll(async () => {
    await payload.updateGlobal({ slug: 'settings', data: { markupPercent: 0, roundTo: 10 } })
    await clearCatalog(payload)
  })

  const first = [
    row('IM-701', 1000, { photoFolder: 'https://drive.google.com/drive/folders/x1' }),
    row('IM-702', 500),
    row('IM-401', 300, {
      type: 'other',
      category: 'Нова категорія',
      collection: '940',
      size: '8 зв',
    }),
  ]

  it('plans creation of new SKUs', async () => {
    const plan = await planImport(payload, first)
    expect(plan.create).toEqual(['IM-701', 'IM-702', 'IM-401'])
    expect(plan.archive).toEqual([])
  })

  it('creates drafts with markup prices, reusing categories by price-list name', async () => {
    const { results } = await runImport(first)
    expect(results.map((r) => r.result)).toEqual(['created', 'created', 'created'])
    expect(results.map((r) => r.needsPhotos)).toEqual([true, false, false])

    const p701 = await bySku('IM-701')
    expect(p701).toMatchObject({
      name: 'Каблучка IM-701',
      status: 'draft',
      autoPublish: true,
      importManaged: true,
    })
    expect(p701.variants[0]).toMatchObject({ costPrice: 1000, price: 1200, quantity: 1 })
    expect(p701.inStock).toBe(true)

    const rings = await payload.find({
      collection: 'categories',
      where: { name: { equals: 'Каблучки' } },
    })
    expect(rings.totalDocs).toBe(1)
    expect(p701.category).toBe(rings.docs[0].id)

    const p401 = await bySku('IM-401')
    expect(p401.variants[0].size).toBe('8 зв')
    expect(p401.autoPublish).toBe(false)
  })

  it('leaves unchanged rows alone and keeps manual edits to the name', async () => {
    const p702 = await bySku('IM-702')
    await payload.update({ collection: 'products', id: p702.id, data: { name: 'Перейменована' } })

    const plan = await planImport(payload, first)
    expect(plan.unchanged).toBe(3)
    const { results } = await runImport(first)
    expect(results.map((r) => r.result)).toEqual(['unchanged', 'unchanged', 'unchanged'])
    expect((await bySku('IM-702')).name).toBe('Перейменована')
  })

  it('updates cost price and recomputes retail price', async () => {
    const changed = [row('IM-701', 2000, { photoFolder: first[0].photoFolder }), first[1], first[2]]
    const plan = await planImport(payload, changed)
    expect(plan.update).toEqual([{ sku: 'IM-701', changes: ['ціна 1000 → 2000'] }])

    await runImport(changed)
    expect((await bySku('IM-701')).variants[0]).toMatchObject({ costPrice: 2000, price: 2400 })
  })

  it('archives products dropped from the price list and restores them when they return', async () => {
    const withoutOne = [row('IM-701', 2000, { photoFolder: first[0].photoFolder }), first[2]]
    expect((await planImport(payload, withoutOne)).archive).toEqual(['IM-702'])

    const { archived } = await runImport(withoutOne)
    expect(archived).toBe(1)
    expect(await bySku('IM-702')).toMatchObject({ status: 'archived', archivedByImport: true })

    const back = [...withoutOne, first[1]]
    const { results } = await runImport(back)
    expect(results[2].result).toBe('updated')
    expect(await bySku('IM-702')).toMatchObject({ status: 'draft', archivedByImport: false })
  })

  it('never touches manually created products with the same SKU', async () => {
    const plan = await planImport(payload, [row('RG-001-16', 1)])
    expect(plan.conflicts).toEqual(['RG-001-16'])

    const { results } = await runImport([...first, row('RG-001-16', 1)])
    expect(results[3].result).toBe('conflict')
    expect((await bySku('RG-001-16')).variants[0].price).toBe(890)
  })
})
