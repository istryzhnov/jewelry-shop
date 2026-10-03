import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CatalogView } from '@/components/store/catalog/CatalogView'
import { getCollectionBySlug } from '@/lib/catalog'
import { parseCatalogParams, type SearchParams } from '@/lib/searchParams'
import { listingMetadata, pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const collection = await getCollectionBySlug((await params).slug)
  if (!collection) return {}
  const path = `/collections/${collection.slug}`
  const base = pageMetadata({
    path,
    title: `Колекція «${collection.name}»`,
    description: collection.description,
    seo: collection.meta,
    image: typeof collection.image === 'object' ? collection.image : null,
  })
  return listingMetadata(path, base, await searchParams)
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const collection = await getCollectionBySlug(slug)
  if (!collection) notFound()

  return (
    <CatalogView
      title={`Колекція «${collection.name}»`}
      description={collection.description}
      path={`/collections/${slug}`}
      params={query}
      filters={{ ...parseCatalogParams(query), collection: collection.id }}
    />
  )
}
