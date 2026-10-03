import type { Metadata } from 'next'
import React from 'react'

import { Analytics } from '@/components/analytics/Analytics'
import { Footer } from '@/components/store/Footer'
import { Header } from '@/components/store/Header'
import { getSettings } from '@/lib/catalog'
import { isIndexable, siteUrl } from '@/lib/seo'

import { inter, prata } from './fonts'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const { shopName } = await getSettings()
  return {
    metadataBase: new URL(siteUrl),
    title: { default: shopName, template: `%s — ${shopName}` },
    description:
      'Каталог прикрас ручної роботи: каблучки, сережки, підвіски. Замовлення в Instagram.',
    robots: isIndexable ? undefined : { index: false, follow: false },
    openGraph: { siteName: shopName, locale: 'uk_UA', type: 'website' },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { analytics } = await getSettings()
  return (
    <html lang="uk" className={`${prata.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics ga4Id={analytics?.ga4Id} pixelId={analytics?.metaPixelId} />
      </body>
    </html>
  )
}
