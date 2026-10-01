import type { Metadata } from 'next'

import { CatalogView } from '@/components/store/catalog/CatalogView'
import { SearchIcon } from '@/components/store/icons'
import { parseCatalogParams, type SearchParams } from '@/lib/searchParams'

export const metadata: Metadata = { title: 'Пошук' }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = parseCatalogParams(params)

  const form = (
    <form
      action="/search"
      role="search"
      className="mt-6 flex max-w-xl items-center border-b border-ink"
    >
      <input
        type="search"
        name="q"
        defaultValue={filters.q}
        placeholder="Назва або артикул, напр. 701"
        aria-label="Пошук"
        autoFocus={!filters.q}
        className="w-full bg-transparent py-3 text-lg outline-none"
      />
      <button type="submit" aria-label="Шукати" className="p-2">
        <SearchIcon />
      </button>
    </form>
  )

  if (!filters.q) {
    return (
      <div className="container-page pt-6">
        <h1 className="font-display text-4xl sm:text-5xl">Пошук</h1>
        {form}
      </div>
    )
  }

  return (
    <CatalogView title={`Пошук: «${filters.q}»`} path="/search" params={params} filters={filters}>
      {form}
    </CatalogView>
  )
}
