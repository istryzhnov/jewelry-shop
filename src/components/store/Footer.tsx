import Link from 'next/link'

import { getCategories, getPages, getSettings } from '@/lib/catalog'
import { instagramProfileUrl } from '@/utilities/format'

import { InstagramIcon } from './icons'
import { Logo } from './Logo'

export async function Footer() {
  const [settings, categories, pages] = await Promise.all([
    getSettings(),
    getCategories(),
    getPages(),
  ])
  const instagramUrl = instagramProfileUrl(settings.instagramUsername)
  const { phone, email, address, legalInfo } = settings.contacts ?? {}

  return (
    <footer className="mt-24 border-t border-sand bg-ivory">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo name={settings.shopName} />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Прикраси ручної роботи. Обирайте на сайті — замовляйте в Instagram.
          </p>
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bronze text-ivory"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
          )}
        </div>
        <FooterColumn title="Каталог">
          {categories
            .filter((c) => !c.parent)
            .map((c) => (
              <Link key={c.id} href={`/catalog/${c.slug}`}>
                {c.name}
              </Link>
            ))}
        </FooterColumn>
        <FooterColumn title="Покупцям">
          {pages.map((p) => (
            <Link key={p.id} href={`/${p.slug}`}>
              {p.title}
            </Link>
          ))}
        </FooterColumn>
        <FooterColumn title="Контакти">
          {phone && <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>}
          {email && <a href={`mailto:${email}`}>{email}</a>}
          {address && <span>{address}</span>}
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
        </FooterColumn>
      </div>
      <div className="container-page border-t border-sand py-6 text-center text-sm text-muted">
        <p>
          © {new Date().getFullYear()} {settings.shopName}
        </p>
        {legalInfo && <p className="mt-1 whitespace-pre-line">{legalInfo}</p>}
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-forest">{title}</h2>
      <div className="flex flex-col gap-3 text-sm text-muted [&_a:hover]:text-ink">{children}</div>
    </div>
  )
}
