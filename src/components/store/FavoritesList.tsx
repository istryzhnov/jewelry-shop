'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { ProductCard as ProductCardData } from '@/lib/catalog'

import { useFavorites } from './favorites'
import { ProductGrid } from './ProductCard'

export function FavoritesList() {
  const { favorites } = useFavorites()
  const [products, setProducts] = useState<ProductCardData[] | null>(null)
  const key = favorites.join(',')

  useEffect(() => {
    if (!key) return
    let cancelled = false
    const query = new URLSearchParams({ 'where[slug][in]': key, depth: '1', limit: '100' })
    fetch(`/api/products?${query}`)
      .then((res) => (res.ok ? res.json() : { docs: [] }))
      .then(({ docs }: { docs: ProductCardData[] }) => {
        // Keep the order in which items were added
        if (!cancelled)
          setProducts(key.split(',').flatMap((slug) => docs.filter((d) => d.slug === slug)))
      })
    return () => {
      cancelled = true
    }
  }, [key])

  if (!key || products?.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">Тут з’являться прикраси, які ви позначите сердечком.</p>
        <Link href="/catalog" className="btn-outline mt-6">
          До каталогу
        </Link>
      </div>
    )
  }
  if (!products) return <p className="py-20 text-center text-muted">Завантаження…</p>
  return <ProductGrid products={products} />
}
