import type { Metadata } from 'next'
import React from 'react'

import { Footer } from '@/components/store/Footer'
import { Header } from '@/components/store/Header'
import { getSettings } from '@/lib/catalog'

import { inter, prata } from './fonts'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const { shopName } = await getSettings()
  return {
    title: { default: shopName, template: `%s — ${shopName}` },
    description: 'Каталог прикрас ручної роботи',
    // Hidden from search engines until the custom domain is connected
    robots: { index: false, follow: false },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${prata.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
