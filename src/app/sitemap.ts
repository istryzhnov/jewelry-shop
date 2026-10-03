import type { MetadataRoute } from 'next'

import { getCategories, getCollections, getPages } from '@/lib/catalog'
import { payloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/seo'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await payloadClient()
  const [products, categories, collections, pages] = await Promise.all([
    payload.find({
      collection: 'products',
      pagination: false,
      depth: 0,
      select: { slug: true, updatedAt: true },
      overrideAccess: false,
    }),
    getCategories(),
    getCollections(),
    getPages(),
  ])

  const entry = (
    path: string,
    lastModified?: string,
    priority = 0.6,
  ): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}${path}`,
    lastModified: lastModified ? new Date(lastModified) : undefined,
    priority,
  })

  return [
    entry('/', undefined, 1),
    entry('/catalog', undefined, 0.9),
    ...categories.map((c) => entry(`/catalog/${c.slug}`, c.updatedAt, 0.8)),
    ...collections.map((c) => entry(`/collections/${c.slug}`, c.updatedAt, 0.7)),
    ...products.docs.map((p) => entry(`/product/${p.slug}`, p.updatedAt, 0.7)),
    ...pages.map((p) => entry(`/${p.slug}`, undefined, 0.4)),
  ]
}
