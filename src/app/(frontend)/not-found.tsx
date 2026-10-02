import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Сторінку не знайдено</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">
        Можливо, прикрасу вже продано або посилання застаріло. Подивіться інші в каталозі.
      </p>
      <Link href="/catalog" className="btn-outline mt-8">
        До каталогу
      </Link>
    </div>
  )
}
