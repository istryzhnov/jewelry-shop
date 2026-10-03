import type { Metadata } from 'next'

import type { Media } from '@/payload-types'

import type { SearchParams } from './searchParams'

export const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)

// Keep search engines out until the real domain is connected
export const isIndexable = process.env.SITE_INDEXABLE === 'true'

export const absoluteUrl = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${siteUrl}${path}`

type SeoFields =
  | { title?: string | null; description?: string | null; image?: number | Media | null }
  | null
  | undefined

const mediaUrl = (m: number | Media | null | undefined) =>
  m && typeof m === 'object' ? (m.sizes?.card?.url ?? m.url ?? undefined) : undefined

export function pageMetadata({
  path,
  title,
  description,
  image,
  seo,
  type = 'website',
}: {
  path: string
  title?: string
  description?: string | null
  image?: Media | null
  seo?: SeoFields
  type?: 'website' | 'article'
}): Metadata {
  const metaTitle = seo?.title || title
  const metaDescription = seo?.description || description || undefined
  const imageUrl = mediaUrl(seo?.image) ?? mediaUrl(image)
  // Undefined keys would override the layout defaults
  return {
    ...(metaTitle ? { title: metaTitle } : {}),
    ...(metaDescription ? { description: metaDescription } : {}),
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      ...(metaTitle ? { title: metaTitle } : {}),
      ...(metaDescription ? { description: metaDescription } : {}),
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
  }
}

const FILTER_KEYS = ['min', 'max', 'stock', 'sort', 'q']

// Filtered/sorted listings are near-duplicates
export function listingMetadata(path: string, base: Metadata, params: SearchParams): Metadata {
  const page = Number(params.page) > 1 ? Number(params.page) : 1
  const filtered = FILTER_KEYS.some((k) => params[k])
  return {
    ...base,
    alternates: { canonical: page > 1 ? `${path}?page=${page}` : path },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  }
}

export const jsonLdScript = (data: unknown) => ({
  __html: JSON.stringify(data).replace(/</g, '\\u003c'),
})
