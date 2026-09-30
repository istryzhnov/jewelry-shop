import Link from 'next/link'

import { type SearchParams, withParams } from '@/lib/searchParams'

const WINDOW = 2

export function Pagination({
  path,
  params,
  page,
  totalPages,
}: {
  path: string
  params: SearchParams
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= WINDOW,
  )
  const href = (p: number) => withParams(path, params, { page: p > 1 ? p : undefined })

  return (
    <nav
      aria-label="Сторінки"
      className="mt-14 flex flex-wrap items-center justify-center gap-1 text-sm"
    >
      {page > 1 && (
        <Link href={href(page - 1)} className="px-3 py-2 hover:text-bronze" rel="prev">
          ← Назад
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-2 text-muted">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`min-w-10 px-3 py-2 text-center ${p === page ? 'bg-forest text-ivory' : 'hover:text-bronze'}`}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages && (
        <Link href={href(page + 1)} className="px-3 py-2 hover:text-bronze" rel="next">
          Далі →
        </Link>
      )}
    </nav>
  )
}
