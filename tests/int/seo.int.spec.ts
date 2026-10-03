import { describe, expect, it } from 'vitest'

import { productFeed, productFeedItems } from '@/lib/feed'
import { listingMetadata, pageMetadata } from '@/lib/seo'
import { productJsonLd } from '@/lib/structuredData'
import type { Media, Product } from '@/payload-types'

const image = (id: number) => ({ id, url: `/api/media/file/p-${id}.webp`, alt: 'x' }) as Media

const product = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 7,
    name: 'Каблучка <Зірка> & Ко',
    slug: 'kabluchka-zirka',
    status: 'published',
    category: { id: 1, name: 'Каблучки', slug: 'kabluchky' },
    images: [image(1), image(2)],
    minPrice: 900,
    variants: [{ sku: 'Z-1', price: 900, quantity: 1 }],
    ...overrides,
  }) as Product

describe('product feed', () => {
  it('emits one item per variant, grouped, with sale price and availability', () => {
    const items = productFeedItems(
      product({
        variants: [
          { sku: 'Z-16', size: '16', price: 900, oldPrice: 1000, quantity: 2 },
          { sku: 'Z-17', size: '17', price: 950, quantity: 0, madeToOrder: true },
          { sku: 'Z-18', size: '18', price: 950, quantity: 0 },
        ],
      }),
      'Бренд',
    )
    expect(items).toHaveLength(3)
    expect(items[0]).toContain('<g:item_group_id>product-7</g:item_group_id>')
    expect(items[0]).toContain(
      '<g:price>1000.00 UAH</g:price><g:sale_price>900.00 UAH</g:sale_price>',
    )
    expect(items[0]).toContain('<g:availability>in_stock</g:availability>')
    expect(items[1]).toContain('<g:availability>preorder</g:availability>')
    expect(items[2]).toContain('<g:availability>out_of_stock</g:availability>')
    expect(items[0]).toContain('<g:title>Каблучка &lt;Зірка&gt; &amp; Ко, розмір 16</g:title>')
    expect(items[0]).toContain('<g:additional_image_link>')
  })

  it('skips products without photos and keeps single variants ungrouped', () => {
    expect(productFeedItems(product({ images: [] }), 'Бренд')).toEqual([])
    const [item] = productFeedItems(product(), 'Бренд')
    expect(item).not.toContain('item_group_id')
  })

  it('wraps items in an RSS document with the Google namespace', () => {
    const feed = productFeed(productFeedItems(product(), 'Бренд'), {
      title: 'Бренд',
      link: 'https://x.ua',
    })
    expect(feed).toMatch(/^<\?xml version="1.0"/)
    expect(feed).toContain('xmlns:g="http://base.google.com/ns/1.0"')
  })
})

describe('structured data', () => {
  it('uses a single Offer or an AggregateOffer depending on variants', () => {
    const single = productJsonLd(product(), { shopName: 'Бренд', description: 'опис' })
    expect(single.offers).toMatchObject({ '@type': 'Offer', price: 900, priceCurrency: 'UAH' })
    expect(single.image).toHaveLength(2)

    const many = productJsonLd(
      product({
        variants: [
          { sku: 'A', price: 900, quantity: 1 },
          { sku: 'B', price: 1200, quantity: 0 },
        ],
      }),
      { shopName: 'Бренд', description: 'опис' },
    )
    expect(many.offers).toMatchObject({
      '@type': 'AggregateOffer',
      lowPrice: 900,
      highPrice: 1200,
      offerCount: 2,
    })
  })
})

describe('listing metadata', () => {
  const base = pageMetadata({ path: '/catalog', title: 'Каталог' })

  it('keeps plain and paginated listings indexable with their own canonical', () => {
    expect(listingMetadata('/catalog', base, {})).toMatchObject({
      alternates: { canonical: '/catalog' },
    })
    const page2 = listingMetadata('/catalog', base, { page: '2' })
    expect(page2.alternates?.canonical).toBe('/catalog?page=2')
    expect(page2.robots).toBeUndefined()
  })

  it('keeps filtered or sorted listings out of the index', () => {
    expect(listingMetadata('/catalog', base, { sort: 'price-asc' }).robots).toEqual({
      index: false,
      follow: true,
    })
  })

  it('prefers SEO fields entered in the admin', () => {
    const meta = pageMetadata({
      path: '/x',
      title: 'Auto',
      description: 'auto',
      seo: { title: 'Manual', description: 'manual' },
    })
    expect(meta).toMatchObject({ title: 'Manual', description: 'manual' })
  })
})
