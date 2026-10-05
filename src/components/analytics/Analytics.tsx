'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useRef } from 'react'

import { type Fbq, markAnalyticsReady } from '@/lib/analytics'

import { setConsent, useConsent } from './consent'

type Props = { ga4Id?: string | null; pixelId?: string | null }

export function Analytics({ ga4Id, pixelId }: Props) {
  const consent = useConsent()
  const enabled = Boolean(ga4Id || pixelId) && consent === 'granted'

  // Runs after child effects, so both tag stubs exist before the flush
  useEffect(() => {
    if (enabled) markAnalyticsReady()
  }, [enabled])

  if (!ga4Id && !pixelId) return null
  if (consent === undefined) return null
  if (consent === null) return <ConsentBanner />
  if (consent === 'denied') return null
  return (
    <>
      {ga4Id && <GoogleAnalytics id={ga4Id} />}
      {pixelId && <MetaPixel id={pixelId} />}
    </>
  )
}

function GoogleAnalytics({ id }: { id: string }) {
  useEffect(() => {
    if (window.gtag) return
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params -- gtag.js expects the arguments object
      window.dataLayer!.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', id)
  }, [id])

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      strategy="afterInteractive"
    />
  )
}

function MetaPixel({ id }: { id: string }) {
  const pathname = usePathname()
  const lastPath = useRef(pathname)

  useEffect(() => {
    if (window.fbq) return
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) (fbq.callMethod as (...a: unknown[]) => void)(...args)
      else fbq.queue.push(args)
    } as Fbq & { queue: unknown[][]; loaded: boolean; version: string; push: unknown }
    fbq.queue = []
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.push = fbq
    window.fbq = fbq
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
    fbq('init', id)
    fbq('track', 'PageView')
  }, [id])

  // GA4 tracks client navigations itself; the Pixel does not
  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    window.fbq?.('track', 'PageView')
  }, [pathname])

  return null
}

function ConsentBanner() {
  return (
    <div
      role="dialog"
      aria-label="Згода на cookie"
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl border border-sand bg-ivory p-5 shadow-lg sm:inset-x-6"
    >
      <p className="text-sm leading-relaxed text-muted">
        Ми використовуємо cookie для аналітики, щоб розуміти, які прикраси вам подобаються. Дані не
        передаються для реклами без вашої згоди.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => setConsent('granted')} className="btn-beige">
          Прийняти
        </button>
        <button type="button" onClick={() => setConsent('denied')} className="btn-outline">
          Лише необхідні
        </button>
      </div>
    </div>
  )
}
