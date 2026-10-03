import { productFeed, productFeedItems } from '@/lib/feed'
import { payloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/seo'

export const revalidate = 3600

export async function GET() {
  const payload = await payloadClient()
  const [settings, products] = await Promise.all([
    payload.findGlobal({ slug: 'settings', depth: 0, overrideAccess: false }),
    payload.find({
      collection: 'products',
      where: { images: { exists: true } },
      pagination: false,
      depth: 1,
      overrideAccess: false,
    }),
  ])
  const items = products.docs.flatMap((p) => productFeedItems(p, settings.shopName))
  return new Response(productFeed(items, { title: settings.shopName, link: siteUrl }), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}
