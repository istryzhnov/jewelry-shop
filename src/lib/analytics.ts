'use client'

type Gtag = (...args: unknown[]) => void
export type Fbq = ((...args: unknown[]) => void) & { callMethod?: unknown }

declare global {
  interface Window {
    gtag?: Gtag
    fbq?: Fbq
    dataLayer?: unknown[]
  }
}

export type AnalyticsItem = {
  item_id: string
  item_name: string
  price?: number | null
  item_category?: string
}

type Events = {
  view_item: { currency: 'UAH'; value: number; items: AnalyticsItem[] }
  view_item_list: { item_list_name: string; items: AnalyticsItem[] }
  search: { search_term: string }
  generate_lead: { currency: 'UAH'; value: number; items: AnalyticsItem[] }
}

const PIXEL: Record<keyof Events, [method: 'track' | 'trackCustom', name: string]> = {
  view_item: ['track', 'ViewContent'],
  view_item_list: ['trackCustom', 'ViewCategory'],
  search: ['track', 'Search'],
  generate_lead: ['track', 'Contact'],
}

// Events fired before the tags start are queued and flushed later
const pending: [keyof Events, Events[keyof Events]][] = []
const MAX_PENDING = 20
let ready = false

export function markAnalyticsReady() {
  ready = true
  for (const [event, params] of pending.splice(0)) send(event, params)
}

export function track<E extends keyof Events>(event: E, params: Events[E]) {
  if (ready) send(event, params)
  else if (pending.length < MAX_PENDING) pending.push([event, params])
}

function send<E extends keyof Events>(event: E, params: Events[E]) {
  window.gtag?.('event', event, params)
  if (window.fbq) {
    const [method, name] = PIXEL[event]
    const items = 'items' in params ? params.items : []
    window.fbq(method, name, {
      ...('value' in params ? { value: params.value, currency: params.currency } : {}),
      ...('search_term' in params ? { search_string: params.search_term } : {}),
      content_ids: items.map((i) => i.item_id),
      content_type: 'product',
    })
  }
}
