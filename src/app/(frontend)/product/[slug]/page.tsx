import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ChevronIcon } from '@/components/store/icons'
import { TrackEvent } from '@/components/analytics/TrackEvent'
import { JsonLd } from '@/components/store/JsonLd'
import { ProductGrid } from '@/components/store/ProductCard'
import { Gallery } from '@/components/store/product/Gallery'
import { Purchase } from '@/components/store/product/Purchase'
import { firstImage, getProductBySlug, getProducts, getSettings } from '@/lib/catalog'
import { METAL_LABELS, TYPE_LABELS } from '@/lib/labels'
import { pageMetadata } from '@/lib/seo'
import { breadcrumbsJsonLd, productJsonLd } from '@/lib/structuredData'
import type { Category, Media, Product } from '@/payload-types'
import { formatPrice, instagramDirectUrl } from '@/utilities/format'

export const revalidate = 600

export const generateStaticParams = () => []

type Props = { params: Promise<{ slug: string }> }

const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

function productDescription(product: Product) {
  const variant = product.variants[0]
  const facts = [
    product.name,
    product.type && TYPE_LABELS[product.type].toLowerCase(),
    variant && `арт. ${variant.sku}`,
    `ціна ${formatPrice(product.minPrice)}`,
  ]
  return `${facts.filter(Boolean).join(', ')}. Замовлення в Instagram, доставка по Україні.`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug)
  if (!product) return {}
  return pageMetadata({
    path: `/product/${product.slug}`,
    title: product.name,
    description: productDescription(product),
    image: firstImage(product.images),
    seo: product.meta,
  })
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()])
  if (!product) notFound()

  const category = typeof product.category === 'object' ? (product.category as Category) : null
  const images = (product.images ?? []).filter((m): m is Media => typeof m === 'object')
  const related = category
    ? await getProducts({
        category: category.id,
        excludeId: product.id,
        limit: 4,
        withImages: true,
      })
    : null

  const variant = product.variants[0]
  const specs = [
    product.type && ['Тип', TYPE_LABELS[product.type]],
    variant?.metal && ['Метал', METAL_LABELS[variant.metal]],
    variant?.purity && ['Проба', variant.purity],
    variant?.weight && ['Вага', `${variant.weight} г`],
    product.coating && ['Покриття', product.coating],
    ...(product.stones ?? []).map((s) => [
      'Камінь',
      [s.stone, s.count && `${s.count} шт`, s.size].filter(Boolean).join(', '),
    ]),
  ].filter(Boolean) as [string, string][]

  const crumbs = [
    { name: 'Каталог', path: '/catalog' },
    ...(category ? [{ name: category.name, path: `/catalog/${category.slug}` }] : []),
    { name: product.name, path: `/product/${product.slug}` },
  ]

  return (
    <div className="container-page pt-4">
      <JsonLd
        data={[
          productJsonLd(product, {
            shopName: settings.shopName,
            description: product.meta?.description || productDescription(product),
          }),
          breadcrumbsJsonLd(crumbs),
        ]}
      />
      <TrackEvent
        event="view_item"
        params={{
          currency: 'UAH',
          value: product.minPrice ?? 0,
          items: [
            {
              item_id: product.variants[0]?.sku ?? product.slug,
              item_name: product.name,
              price: product.minPrice,
              item_category: category?.name,
            },
          ],
        }}
      />
      <nav aria-label="Хлібні крихти" className="mb-6 text-sm text-muted">
        <Link href="/catalog" className="hover:text-ink">
          Каталог
        </Link>
        {category && (
          <>
            {' / '}
            <Link href={`/catalog/${category.slug}`} className="hover:text-ink">
              {category.name}
            </Link>
          </>
        )}
        {' / '}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
        <Gallery images={images} name={product.name} />

        <div className="lg:pt-2">
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">{product.name}</h1>
          {(product.isNew || product.isUnique) && (
            <p className="mt-3 flex gap-2 text-xs uppercase tracking-wider text-bronze">
              {product.isNew && <span>Новинка</span>}
              {product.isUnique && <span>Унікальний виріб</span>}
            </p>
          )}
          <div className="mt-6">
            <Purchase
              category={category?.name}
              name={product.name}
              slug={product.slug}
              url={`${siteUrl}/product/${product.slug}`}
              variants={product.variants}
              instagramDirect={instagramDirectUrl(settings.instagramUsername)}
            />
          </div>

          <div className="mt-10 divide-y divide-sand border-y border-sand">
            {product.description && (
              <Accordion title="Опис" open>
                <RichText
                  data={product.description}
                  className="space-y-3 leading-relaxed text-muted"
                />
              </Accordion>
            )}
            {specs.length > 0 && (
              <Accordion title="Характеристики" open={!product.description}>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  {specs.map(([label, value], i) => (
                    <div key={i} className="contents">
                      <dt className="text-muted">{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </Accordion>
            )}
            <Accordion title="Доставка й оплата">
              <p className="text-sm leading-relaxed text-muted">
                Доставляємо Новою Поштою або Укрпоштою по всій Україні. Спосіб оплати й доставки
                узгоджуємо в Instagram після замовлення.
              </p>
            </Accordion>
            <Accordion title="Догляд за прикрасою">
              <p className="text-sm leading-relaxed text-muted">
                Зберігайте прикрасу окремо в сухому місці, знімайте перед душем, спортом і
                нанесенням косметики. Протирайте м’якою серветкою.
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      {related && related.docs.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-display text-3xl sm:text-4xl">Рекомендуємо</h2>
          <ProductGrid products={related.docs} />
        </section>
      )}
    </div>
  )
}

function Accordion({
  title,
  open,
  children,
}: {
  title: string
  open?: boolean
  children: React.ReactNode
}) {
  return (
    <details open={open} className="group py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  )
}
