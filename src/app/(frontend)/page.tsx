import Link from 'next/link'

import { Feature } from '@/components/store/home/Feature'
import { Hero } from '@/components/store/home/Hero'
import { HowToOrder } from '@/components/store/home/HowToOrder'
import { ProductTabs } from '@/components/store/home/ProductTabs'
import { ArrowIcon } from '@/components/store/icons'
import { ProductGrid } from '@/components/store/ProductCard'
import { firstImage, getCategories, getHomepage, getProducts } from '@/lib/catalog'
import type { Media, ProductCollection } from '@/payload-types'

export const revalidate = 600

const TAB_CATEGORIES = 3
const TAB_PRODUCTS = 4

const mediaOf = (value: unknown): Media | null =>
  value && typeof value === 'object' && 'url' in value ? (value as Media) : null

export default async function HomePage() {
  const [homepage, categories] = await Promise.all([getHomepage(), getCategories()])
  const tabCategories = categories.filter((c) => !c.parent).slice(0, TAB_CATEGORIES)
  const newArrivals = homepage.newArrivalsCount || TAB_PRODUCTS

  const [latest, withPhoto, ...byCategory] = await Promise.all([
    getProducts({ limit: Math.min(newArrivals, 8), withImages: true }),
    getProducts({ limit: 1, withImages: true }),
    ...tabCategories.map((c) =>
      getProducts({ category: c.id, limit: TAB_PRODUCTS, withImages: true }),
    ),
  ])

  const collections = (homepage.featuredCollections ?? []).filter(
    (c): c is ProductCollection => typeof c === 'object',
  )
  const featureImages = await Promise.all(
    collections.slice(0, 2).map(async (c) => {
      if (mediaOf(c.image)) return mediaOf(c.image)
      const { docs } = await getProducts({ collection: c.id, limit: 1, withImages: true })
      return firstImage(docs[0]?.images)
    }),
  )

  const tabs = [
    { id: 'new', label: 'Новинки', products: latest.docs },
    ...tabCategories.map((c, i) => ({ id: c.slug, label: c.name, products: byCategory[i].docs })),
  ].filter((t) => t.products.length)

  const { hero } = homepage

  return (
    <>
      <Hero
        title={hero?.title || 'Прикраси ручної роботи'}
        subtitle={hero?.subtitle}
        buttonText={hero?.buttonText || 'До каталогу'}
        buttonLink={hero?.buttonLink || '/catalog'}
        image={mediaOf(hero?.image) ?? firstImage(withPhoto.docs[0]?.images)}
      />

      {tabs.length > 0 && (
        <section className="container-page py-20 lg:py-24">
          <div className="mb-8 text-center">
            <p className="eyebrow">Базове та вишукане</p>
            <h2 className="mt-2 font-display text-5xl sm:text-6xl lg:text-7xl">Наші прикраси</h2>
          </div>
          <ProductTabs
            tabs={tabs.map((t) => ({
              id: t.id,
              label: t.label,
              content: <ProductGrid products={t.products.slice(0, TAB_PRODUCTS)} />,
            }))}
          />
          <div className="mt-12 text-center">
            <Link href="/catalog" className="btn-outline">
              До каталогу <ArrowIcon />
            </Link>
          </div>
        </section>
      )}

      {collections.slice(0, 2).map((c, i) => (
        <Feature
          key={c.id}
          eyebrow="Колекція"
          title={c.name}
          text={c.description}
          href={`/collections/${c.slug}`}
          image={featureImages[i]}
          tone={i === 0 ? 'cream' : 'forest'}
          imageSide={i === 0 ? 'left' : 'right'}
        />
      ))}

      <HowToOrder />
    </>
  )
}
