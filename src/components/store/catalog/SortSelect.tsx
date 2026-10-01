'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const OPTIONS = [
  { value: 'new', label: 'Спочатку нові' },
  { value: 'price-asc', label: 'Ціна: від низької' },
  { value: 'price-desc', label: 'Ціна: від високої' },
]

export function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Сортування</span>
      <select
        value={params.get('sort') ?? 'new'}
        onChange={(e) => {
          const next = new URLSearchParams(params)
          next.set('sort', e.target.value)
          next.delete('page')
          router.push(`${pathname}?${next}`)
        }}
        className="border-0 bg-transparent py-1 pr-6 text-sm font-medium focus:ring-0"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
