import type { Metadata } from 'next'

import { FavoritesList } from '@/components/store/FavoritesList'

export const metadata: Metadata = { title: 'Улюблене', robots: { index: false, follow: true } }

export default function FavoritesPage() {
  return (
    <div className="container-page pt-6">
      <h1 className="mb-10 font-display text-4xl sm:text-5xl">Улюблене</h1>
      <FavoritesList />
    </div>
  )
}
