'use client'

import { useSyncExternalStore } from 'react'

export type Consent = 'granted' | 'denied' | null

const KEY = 'cookie-consent'
const EVENT = 'cookie-consent-change'

function read(): Consent {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function useConsent(): Consent | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined)
}

export function setConsent(value: Exclude<Consent, null>) {
  try {
    localStorage.setItem(KEY, value)
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}
