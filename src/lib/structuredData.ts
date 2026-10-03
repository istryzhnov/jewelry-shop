import type { Category, Media, Product } from '@/payload-types'

import { absoluteUrl, siteUrl } from './seo'

type Variant = Product['variants'][number]

const availability = (v: Variant) =>
  (v.quantity ?? 0) > 0
    ? 'https://schema.org/InStock'
    : v.madeToOrder
      ? 'https://schema.org/PreOrder'
      : 'https://schema.org/OutOfStock'

export function productJsonLd(
  product: Product,
  { shopName, description }: { shopName: string; description: string },
) {
  const url = absoluteUrl(`/product/${product.slug}`)
  const images = (product.images ?? [])
    .filter((m): m is Media => typeof m === 'object' && Boolean(m.url))
    .map((m) => absoluteUrl(m.url!))
  const category =
    typeof product.category === 'object' ? (product.category as Category).name : undefined

  const offer = (v: Variant) => ({
    '@type': 'Offer',
    sku: v.sku,
    price: v.price,
    priceCurrency: 'UAH',
    availability: availability(v),
    itemCondition: 'https://schema.org/NewCondition',
    url,
  })
  const prices = product.variants.map((v) => v.price)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.variants[0]?.sku,
    description,
    image: images.length ? images : undefined,
    category,
    brand: { '@type': 'Brand', name: shopName },
    offers:
      product.variants.length === 1
        ? offer(product.variants[0])
        : {
            '@type': 'AggregateOffer',
            priceCurrency: 'UAH',
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: product.variants.length,
            offers: product.variants.map(offer),
          },
  }
}

export function breadcrumbsJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function siteJsonLd({
  shopName,
  instagramUrl,
}: {
  shopName: string
  instagramUrl: string | null
}) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: shopName,
      url: siteUrl,
      logo: absoluteUrl('/logo.svg'),
      sameAs: instagramUrl ? [instagramUrl] : undefined,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: shopName,
      url: siteUrl,
      inLanguage: 'uk',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ]
}
