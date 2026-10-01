'use client'

import { useFavorites } from './favorites'
import { HeartIcon } from './icons'

export function FavoriteButton({
  slug,
  className = '',
  withLabel = false,
}: {
  slug: string
  className?: string
  withLabel?: boolean
}) {
  const { has, toggle } = useFavorites()
  const active = has(slug)
  const label = active ? 'Прибрати з улюбленого' : 'Додати в улюблене'
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        toggle(slug)
      }}
      aria-pressed={active}
      aria-label={withLabel ? undefined : label}
      className={`inline-flex items-center gap-2 transition-colors ${active ? 'text-bronze' : 'hover:text-bronze'} ${className}`}
    >
      <HeartIcon filled={active} />
      {withLabel && <span className="text-sm">{label}</span>}
    </button>
  )
}
