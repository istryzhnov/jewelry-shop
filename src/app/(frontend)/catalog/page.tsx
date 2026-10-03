import type { Metadata } from 'next'

import { CatalogView } from '@/components/store/catalog/CatalogView'
import { parseCatalogParams, type SearchParams } from '@/lib/searchParams'
import { listingMetadata, pageMetadata } from '@/lib/seo'

type Props = { searchParams: Promise<SearchParams> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const base = pageMetadata({
    path: '/catalog',
    title: 'Каталог прикрас',
    description:
      'Усі прикраси: каблучки, сережки, підвіски, кольє та браслети з цінами й наявністю.',
  })
  return listingMetadata('/catalog', base, await searchParams)
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  return (
    <CatalogView
      title="Каталог"
      path="/catalog"
      params={params}
      filters={parseCatalogParams(params)}
    />
  )
}
