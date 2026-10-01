import Link from 'next/link'

import type { ProductCard as ProductCardData } from '@/lib/catalog'
import { firstImage } from '@/lib/media'
import { formatPrice } from '@/utilities/format'

import { FavoriteButton } from './FavoriteButton'
import { ProductImage } from './ProductImage'

export function availabilityLabel(p: Pick<ProductCardData, 'inStock' | 'madeToOrder'>) {
  if (p.inStock) return null
  return p.madeToOrder ? 'Під замовлення' : 'Немає в наявності'
}

export function ProductCard({
  product,
  priority,
}: {
  product: ProductCardData
  priority?: boolean
}) {
  const oldPrice = product.variants?.find(
    (v) => v.oldPrice && v.price === product.minPrice,
  )?.oldPrice
  const multiplePrices = new Set(product.variants?.map((v) => v.price)).size > 1
  const availability = availabilityLabel(product)

  return (
    <article className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-cream">
          <ProductImage
            media={firstImage(product.images)}
            alt={product.name}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {product.isNew && <Badge>Новинка</Badge>}
            {product.isUnique && <Badge>Унікальний виріб</Badge>}
          </div>
        </div>
        <h3 className="mt-3 line-clamp-2 text-sm leading-snug sm:text-base">{product.name}</h3>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm sm:text-base">
          <span className="font-medium">
            {multiplePrices && 'від '}
            {formatPrice(product.minPrice)}
          </span>
          {oldPrice && <s className="text-sm text-muted">{formatPrice(oldPrice)}</s>}
        </p>
        {availability && <p className="mt-1 text-xs text-muted">{availability}</p>}
      </Link>
      <FavoriteButton
        slug={product.slug}
        className="absolute right-2 top-2 rounded-full bg-ivory/80 p-2"
      />
    </article>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-ivory/90 px-2 py-1 text-[11px] uppercase tracking-wider text-forest">
      {children}
    </span>
  )
}

export function ProductGrid({
  products,
  prioritizeFirst = 0,
}: {
  products: ProductCardData[]
  prioritizeFirst?: number
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < prioritizeFirst} />
      ))}
    </div>
  )
}
