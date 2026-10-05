import Link from 'next/link'

import type { ProductFilters } from '@/lib/catalog'
import type { SearchParams } from '@/lib/searchParams'
import type { Category } from '@/payload-types'

import { ChevronIcon } from '../icons'

type Props = {
  path: string
  params: SearchParams
  filters: ProductFilters
  categories: Category[]
  activeCategory?: string
}

export function Filters({ path, params, filters, categories, activeCategory }: Props) {
  const active = [filters.minPrice, filters.maxPrice, filters.inStock].filter(Boolean).length
  const topLevel = categories.filter((c) => !c.parent)

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="flex flex-col gap-[3px]" aria-hidden>
          <span className="h-px w-4 bg-ink" />
          <span className="h-px w-3 bg-ink" />
          <span className="h-px w-2 bg-ink" />
        </span>
        Фільтри{active > 0 && ` (${active})`}
        <ChevronIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 z-30 mt-3 w-[min(22rem,calc(100vw-2rem))] border border-sand bg-ivory p-5 shadow-lg">
        {topLevel.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted">Категорія</p>
            <div className="flex flex-wrap gap-2">
              <Chip href="/catalog" active={!activeCategory}>
                Усі
              </Chip>
              {topLevel.map((c) => (
                <Chip key={c.id} href={`/catalog/${c.slug}`} active={activeCategory === c.slug}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>
        )}
        <form action={path} className="space-y-5">
          {params.q && <input type="hidden" name="q" value={String(params.q)} />}
          {params.sort && <input type="hidden" name="sort" value={String(params.sort)} />}
          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-wider text-muted">Ціна, ₴</legend>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="min"
                min={0}
                inputMode="numeric"
                placeholder="від"
                defaultValue={filters.minPrice}
                aria-label="Ціна від"
                className="w-full border border-sand bg-transparent px-3 py-2 text-sm"
              />
              <span className="text-muted">—</span>
              <input
                type="number"
                name="max"
                min={0}
                inputMode="numeric"
                placeholder="до"
                defaultValue={filters.maxPrice}
                aria-label="Ціна до"
                className="w-full border border-sand bg-transparent px-3 py-2 text-sm"
              />
            </div>
          </fieldset>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="stock"
              value="1"
              defaultChecked={filters.inStock}
              className="h-4 w-4 accent-forest"
            />
            Лише доступні для замовлення
          </label>
          <div className="flex items-center justify-between gap-3">
            <button type="submit" className="btn-beige">
              Застосувати
            </button>
            {active > 0 && (
              <Link
                href={params.q ? `${path}?q=${encodeURIComponent(String(params.q))}` : path}
                className="text-sm underline"
              >
                Скинути
              </Link>
            )}
          </div>
        </form>
      </div>
    </details>
  )
}

function Chip({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`border px-3 py-1.5 text-sm ${active ? 'border-forest bg-forest text-ivory' : 'border-sand hover:border-ink'}`}
    >
      {children}
    </Link>
  )
}
