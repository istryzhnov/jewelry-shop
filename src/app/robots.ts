import type { MetadataRoute } from 'next'

import { isIndexable, siteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/search', '/favorites'] },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
