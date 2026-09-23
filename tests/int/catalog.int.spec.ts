import { getPayload, Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { clearCatalog, seed } from '@/seed'

let payload: Payload

// Payload puts field messages into error.data.errors rather than error.message
const expectValidationError = async (promise: Promise<unknown>, pattern: RegExp) => {
  const error = await promise.then(
    () => null,
    (e: { data?: { errors?: { message: string }[] } }) => e,
  )
  expect(error, 'expected a validation error').not.toBeNull()
  expect(error?.data?.errors?.map((e) => e.message).join('\n')).toMatch(pattern)
}

const findProduct = async (sku: string) => {
  const { docs } = await payload.find({
    collection: 'products',
    where: { 'variants.sku': { equals: sku } },
  })
  return docs[0]
}

const categoryId = async (name: string) => {
  const { docs } = await payload.find({
    collection: 'categories',
    where: { name: { equals: name } },
  })
  return docs[0].id
}

describe('catalog', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await clearCatalog(payload)
    await seed(payload)
  })

  afterAll(async () => {
    await clearCatalog(payload)
  })

  it('generates a transliterated slug when none is given', async () => {
    const doc = await payload.create({
      collection: 'product-collections',
      data: { name: 'Весняна колекція' } as never,
    })
    expect(doc.slug).toBe('vesniana-kolektsiia')
  })

  it('computes minPrice and inStock from variants', async () => {
    const ring = await findProduct('RG-001-16')
    expect(ring.minPrice).toBe(890)
    expect(ring.inStock).toBe(true)

    const bracelet = await findProduct('BR-040-17')
    expect(bracelet.inStock).toBe(false)
    expect(bracelet.madeToOrder).toBe(true)
  })

  it('rejects a SKU already used by another product', async () => {
    await expectValidationError(
      payload.create({
        collection: 'products',
        data: {
          name: 'Дублікат',
          slug: 'dublikat',
          status: 'draft',
          category: await categoryId('Каблучки'),
          variants: [{ sku: 'RG-001-16', price: 100, quantity: 1 }],
        },
      }),
      /RG-001-16/,
    )
  })

  it('rejects duplicate SKUs within one product', async () => {
    await expectValidationError(
      payload.create({
        collection: 'products',
        data: {
          name: 'Два однакові',
          slug: 'dva-odnakovi',
          status: 'draft',
          category: await categoryId('Каблучки'),
          variants: [
            { sku: 'DUP-1', price: 100, quantity: 1 },
            { sku: 'DUP-1', price: 100, quantity: 1 },
          ],
        },
      }),
      /повторюється/,
    )
  })

  it('allows updating a product without tripping its own SKUs', async () => {
    const ring = await findProduct('RG-001-16')
    const updated = await payload.update({
      collection: 'products',
      id: ring.id,
      data: { isNew: false },
    })
    expect(updated.isNew).toBe(false)
  })

  it('limits a unique item to one variant with quantity ≤ 1', async () => {
    await expectValidationError(
      payload.create({
        collection: 'products',
        data: {
          name: 'Унікальна',
          slug: 'unikalna',
          status: 'draft',
          isUnique: true,
          category: await categoryId('Підвіски'),
          variants: [{ sku: 'UQ-1', price: 100, quantity: 2 }],
        },
      }),
      /Унікальний виріб/,
    )
  })

  it('allows only two category levels', async () => {
    await expectValidationError(
      payload.create({
        collection: 'categories',
        data: { name: 'Третій рівень', slug: 'tretii-riven', parent: await categoryId('Обручки') },
      }),
      /два рівні/,
    )
  })

  it('hides drafts from anonymous visitors', async () => {
    const { docs } = await payload.find({
      collection: 'products',
      overrideAccess: false,
      limit: 100,
    })
    expect(docs.length).toBeGreaterThan(0)
    expect(docs.every((d) => d.status === 'published')).toBe(true)
  })
})

describe('markup pricing', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await clearCatalog(payload)
    await seed(payload)
  })

  afterAll(async () => {
    await payload.updateGlobal({ slug: 'settings', data: { markupPercent: 0, roundTo: 10 } })
    await clearCatalog(payload)
  })

  it('derives price from cost and recalculates when markup changes', async () => {
    await payload.updateGlobal({ slug: 'settings', data: { markupPercent: 30, roundTo: 10 } })
    const categories = await payload.find({ collection: 'categories', limit: 1 })
    const product = await payload.create({
      collection: 'products',
      data: {
        name: 'З прайсу',
        slug: 'z-praisu',
        status: 'draft',
        category: categories.docs[0].id,
        variants: [{ sku: 'COST-1', costPrice: 1210, price: 0, quantity: 1 }],
      },
    })
    expect(product.variants[0].price).toBe(1580)
    expect(product.minPrice).toBe(1580)

    await payload.updateGlobal({ slug: 'settings', data: { markupPercent: 50 } })
    const updated = await payload.findByID({ collection: 'products', id: product.id })
    expect(updated.variants[0].price).toBe(1820)
    expect(updated.minPrice).toBe(1820)
  })

  it('hides cost price from anonymous visitors', async () => {
    const { docs } = await payload.find({
      collection: 'products',
      overrideAccess: false,
      where: { status: { equals: 'published' } },
      limit: 1,
    })
    expect(docs[0].variants[0]).not.toHaveProperty('costPrice')
  })
})
