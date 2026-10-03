import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CatalogView } from '@/components/store/catalog/CatalogView'
import { JsonLd } from '@/components/store/JsonLd'
import { getCategories, getCategoryBySlug } from '@/lib/catalog'
import { parseCatalogParams, type SearchParams } from '@/lib/searchParams'
import { listingMetadata, pageMetadata } from '@/lib/seo'
import { breadcrumbsJsonLd } from '@/lib/structuredData'

type Props = { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).category)
  if (!category) return {}
  const path = `/catalog/${category.slug}`
  const base = pageMetadata({
    path,
    title: category.name,
    description:
      category.description ||
      `${category.name} — каталог з цінами та наявністю. Замовлення в Instagram.`,
    seo: category.meta,
  })
  return listingMetadata(path, base, await searchParams)
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category: slug }, query] = await Promise.all([params, searchParams])
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const children = (await getCategories()).filter(
    (c) => (typeof c.parent === 'object' ? c.parent?.id : c.parent) === category.id,
  )

  return (
    <CatalogView
      title={category.name}
      description={category.description}
      path={`/catalog/${slug}`}
      params={query}
      filters={{ ...parseCatalogParams(query), category: category.id }}
      activeCategory={slug}
    >
      <JsonLd
        data={breadcrumbsJsonLd([
          { name: 'Каталог', path: '/catalog' },
          { name: category.name, path: `/catalog/${slug}` },
        ])}
      />
      {children.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {children.map((c) => (
            <Link
              key={c.id}
              href={`/catalog/${c.slug}`}
              className="border border-sand px-3 py-1.5 text-sm hover:border-ink"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </CatalogView>
  )
}
