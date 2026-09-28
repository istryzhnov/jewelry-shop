import type { Where } from 'payload'
import { cache } from 'react'

import type { Category, Page, Product, ProductCollection } from '@/payload-types'

import { payloadClient } from './payload'

// Storefront reads always go through access control: published docs only, no cost prices
const PUBLIC = { overrideAccess: false } as const

export const PAGE_SIZE = 24

export type SortKey = 'new' | 'price-asc' | 'price-desc'

const SORTS: Record<SortKey, string> = {
  new: '-createdAt',
  'price-asc': 'minPrice',
  'price-desc': '-minPrice',
}

export type ProductFilters = {
  category?: number
  collection?: number
  q?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sort?: SortKey
  page?: number
  limit?: number
  excludeId?: number
  withImages?: boolean
}

// Fields a product card needs; keeps list queries light
const CARD_SELECT = {
  name: true,
  slug: true,
  images: true,
  minPrice: true,
  inStock: true,
  madeToOrder: true,
  isNew: true,
  isUnique: true,
  variants: true,
  category: true,
} as const

export type ProductCard = Pick<
  Product,
  | 'id'
  | 'name'
  | 'slug'
  | 'images'
  | 'minPrice'
  | 'inStock'
  | 'madeToOrder'
  | 'isNew'
  | 'isUnique'
  | 'variants'
  | 'category'
>

export const getSettings = cache(async () =>
  (await payloadClient()).findGlobal({ slug: 'settings', depth: 0, ...PUBLIC }),
)

export const getHomepage = cache(async () =>
  (await payloadClient()).findGlobal({ slug: 'homepage', depth: 2, ...PUBLIC }),
)

export const getCategories = cache(async (): Promise<Category[]> => {
  const { docs } = await (
    await payloadClient()
  ).find({
    collection: 'categories',
    sort: '_order',
    depth: 0,
    pagination: false,
    ...PUBLIC,
  })
  return docs
})

export const getCategoryBySlug = cache(async (slug: string) => {
  const categories = await getCategories()
  return categories.find((c) => c.slug === slug) ?? null
})

export const getCollections = cache(async (): Promise<ProductCollection[]> => {
  const { docs } = await (
    await payloadClient()
  ).find({
    collection: 'product-collections',
    sort: '_order',
    depth: 1,
    pagination: false,
    ...PUBLIC,
  })
  return docs
})

export const getCollectionBySlug = cache(async (slug: string) => {
  const collections = await getCollections()
  return collections.find((c) => c.slug === slug) ?? null
})

// A category page also lists products of its subcategories
async function categoryIds(id: number) {
  const categories = await getCategories()
  return [
    id,
    ...categories
      .filter((c) => (typeof c.parent === 'object' ? c.parent?.id : c.parent) === id)
      .map((c) => c.id),
  ]
}

export async function getProducts(filters: ProductFilters = {}) {
  const and: Where[] = []
  if (filters.category) and.push({ category: { in: await categoryIds(filters.category) } })
  if (filters.collection) and.push({ collection: { equals: filters.collection } })
  if (filters.q) {
    and.push({ or: [{ name: { like: filters.q } }, { 'variants.sku': { like: filters.q } }] })
  }
  if (filters.minPrice) and.push({ minPrice: { greater_than_equal: filters.minPrice } })
  if (filters.maxPrice) and.push({ minPrice: { less_than_equal: filters.maxPrice } })
  if (filters.inStock)
    and.push({ or: [{ inStock: { equals: true } }, { madeToOrder: { equals: true } }] })
  if (filters.excludeId) and.push({ id: { not_equals: filters.excludeId } })
  if (filters.withImages) and.push({ images: { exists: true } })

  const result = await (
    await payloadClient()
  ).find({
    collection: 'products',
    where: and.length ? { and } : undefined,
    sort: SORTS[filters.sort ?? 'new'],
    limit: filters.limit ?? PAGE_SIZE,
    page: filters.page ?? 1,
    depth: 1,
    select: CARD_SELECT,
    ...PUBLIC,
  })
  return { ...result, docs: result.docs as ProductCard[] }
}

export const getProductBySlug = cache(async (slug: string) => {
  const { docs } = await (
    await payloadClient()
  ).find({
    collection: 'products',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    ...PUBLIC,
  })
  return docs[0] ?? null
})

export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  const { docs } = await (
    await payloadClient()
  ).find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
    ...PUBLIC,
  })
  return docs[0] ?? null
})

export const getPages = cache(async () => {
  const { docs } = await (
    await payloadClient()
  ).find({
    collection: 'pages',
    depth: 0,
    pagination: false,
    select: { title: true, slug: true },
    ...PUBLIC,
  })
  return docs
})

export { firstImage } from './media'
