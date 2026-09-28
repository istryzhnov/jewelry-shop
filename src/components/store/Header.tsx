import Link from 'next/link'

import { getCategories, getSettings } from '@/lib/catalog'
import { instagramProfileUrl } from '@/utilities/format'

import { HeartIcon, InstagramIcon, SearchIcon } from './icons'
import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'

const MAX_CATEGORY_LINKS = 4

export async function Header() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()])
  const topLevel = categories.filter((c) => !c.parent).slice(0, MAX_CATEGORY_LINKS)
  const links = [
    { href: '/catalog', label: 'Каталог' },
    ...topLevel.map((c) => ({ href: `/catalog/${c.slug}`, label: c.name })),
  ]
  const instagramUrl = instagramProfileUrl(settings.instagramUsername)

  return (
    <header className="relative z-20">
      <div className="container-page flex h-20 items-center justify-between gap-6 lg:h-24">
        <Logo name={settings.shopName} />
        <nav aria-label="Основна навігація" className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-forest transition-colors hover:text-bronze"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 text-forest sm:gap-3">
          <Link href="/search" aria-label="Пошук" className="p-2 hover:text-bronze">
            <SearchIcon />
          </Link>
          <Link
            href="/favorites"
            aria-label="Улюблене"
            className="hidden p-2 hover:text-bronze sm:block"
          >
            <HeartIcon />
          </Link>
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hidden p-2 hover:text-bronze sm:block"
            >
              <InstagramIcon />
            </a>
          )}
          <MobileMenu links={links} instagramUrl={instagramUrl} />
        </div>
      </div>
    </header>
  )
}
