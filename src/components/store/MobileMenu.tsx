'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { CloseIcon, MenuIcon } from './icons'

type NavLink = { href: string; label: string }

export function MobileMenu({
  links,
  instagramUrl,
}: {
  links: NavLink[]
  instagramUrl: string | null
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close on navigation
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Відкрити меню"
        className="p-2"
      >
        <MenuIcon />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-ivory"
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
        >
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Закрити меню"
              className="p-2"
            >
              <CloseIcon />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-sand py-4 font-display text-2xl"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/favorites" className="border-b border-sand py-4 font-display text-2xl">
              Улюблене
            </Link>
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-4 text-bronze"
              >
                Instagram
              </a>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
