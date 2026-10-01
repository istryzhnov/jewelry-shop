import type { Metadata } from 'next'

import { CatalogView } from '@/components/store/catalog/CatalogView'
import { parseCatalogParams, type SearchParams } from '@/lib/searchParams'

export const metadata: Metadata = { title: 'Каталог' }

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
