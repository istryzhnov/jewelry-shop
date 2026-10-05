import { Suspense } from 'react'

import { getCategories, getProducts, type ProductFilters } from '@/lib/catalog'
import type { SearchParams } from '@/lib/searchParams'

import { TrackEvent } from '../../analytics/TrackEvent'
import { ProductGrid } from '../ProductCard'
import { Filters } from './Filters'
import { Pagination } from './Pagination'
import { SortSelect } from './SortSelect'

type Props = {
  title: string
  description?: string | null
  path: string
  params: SearchParams
  filters: ProductFilters
  activeCategory?: string
  children?: React.ReactNode
}

export async function CatalogView({
  title,
  description,
  path,
  params,
  filters,
  activeCategory,
  children,
}: Props) {
  const [result, categories] = await Promise.all([getProducts(filters), getCategories()])

  return (
    <div className="container-page pt-6">
      <TrackEvent
        event="view_item_list"
        params={{
          item_list_name: title,
          items: result.docs.slice(0, 20).map((p) => ({
            item_id: p.variants?.[0]?.sku ?? p.slug,
            item_name: p.name,
            price: p.minPrice,
          })),
        }}
      />
      {filters.q && <TrackEvent event="search" params={{ search_term: filters.q }} />}
      <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-muted">{description}</p>}
      {children}
      <div className="mt-8 flex items-center justify-between gap-4 border-b border-sand pb-4">
        <Filters
          path={path}
          params={params}
          filters={filters}
          categories={categories}
          activeCategory={activeCategory}
        />
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted sm:inline">{result.totalDocs} товарів</span>
          <Suspense>
            <SortSelect />
          </Suspense>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="sr-only">Товари</h2>
        {result.docs.length ? (
          <ProductGrid products={result.docs} prioritizeFirst={4} />
        ) : (
          <p className="py-20 text-center text-muted">
            Нічого не знайдено. Спробуйте змінити фільтри.
          </p>
        )}
      </div>
      <Pagination
        path={path}
        params={params}
        page={result.page ?? 1}
        totalPages={result.totalPages}
      />
    </div>
  )
}
