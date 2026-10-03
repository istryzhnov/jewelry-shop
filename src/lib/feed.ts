import type { Category, Media, Product } from '@/payload-types'

import { variantLabel } from './labels'
import { absoluteUrl } from './seo'

// Google product taxonomy: Apparel & Accessories > Jewelry
const GOOGLE_CATEGORY = 188
const MAX_EXTRA_IMAGES = 10

const xml = (value: string | number) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const money = (value: number) => `${value.toFixed(2)} UAH`

const tag = (name: string, value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '' : `<${name}>${xml(value)}</${name}>`

function availability(v: Product['variants'][number]) {
  if ((v.quantity ?? 0) > 0) return 'in_stock'
  return v.madeToOrder ? 'preorder' : 'out_of_stock'
}

export function productFeedItems(product: Product, brand: string): string[] {
  const images = (product.images ?? []).filter(
    (m): m is Media => typeof m === 'object' && Boolean(m.url),
  )
  if (!images.length) return []

  const link = absoluteUrl(`/product/${product.slug}`)
  const category =
    typeof product.category === 'object' ? (product.category as Category).name : undefined
  const grouped = product.variants.length > 1
  const description = product.meta?.description || `${product.name}. Прикраса з каталогу ${brand}.`

  return product.variants.map((v) => {
    const label = variantLabel(v)
    const onSale = typeof v.oldPrice === 'number' && v.oldPrice > v.price
    return [
      '<item>',
      tag('g:id', v.sku),
      grouped ? tag('g:item_group_id', `product-${product.id}`) : '',
      tag('g:title', grouped && label ? `${product.name}, ${label}` : product.name),
      tag('g:description', description),
      tag('g:link', link),
      tag('g:image_link', absoluteUrl(images[0].url!)),
      ...images
        .slice(1, MAX_EXTRA_IMAGES + 1)
        .map((m) => tag('g:additional_image_link', absoluteUrl(m.url!))),
      tag('g:availability', availability(v)),
      tag('g:price', money(onSale ? v.oldPrice! : v.price)),
      onSale ? tag('g:sale_price', money(v.price)) : '',
      tag('g:brand', brand),
      tag('g:condition', 'new'),
      tag('g:identifier_exists', 'no'),
      tag('g:google_product_category', GOOGLE_CATEGORY),
      tag('g:product_type', category),
      tag('g:size', v.size),
      '</item>',
    ].join('')
  })
}

export function productFeed(items: string[], { title, link }: { title: string; link: string }) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    tag('title', title),
    tag('link', link),
    tag('description', `Каталог ${title}`),
    ...items,
    '</channel>',
    '</rss>',
  ].join('\n')
}
