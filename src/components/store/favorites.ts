'use client'

import { useCallback, useSyncExternalStore } from 'react'

const KEY = 'favorites'
const EVENT = 'favorites-change'

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

// Cached snapshot keeps useSyncExternalStore from looping on a fresh array each call
let snapshot: string[] = []
let raw: string | null = null
function getSnapshot() {
  let current: string | null = null
  try {
    current = localStorage.getItem(KEY)
  } catch {}
  if (current !== raw) {
    raw = current
    snapshot = read()
  }
  return snapshot
}

const EMPTY: string[] = []

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(EVENT, onChange)
  }
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)
  const toggle = useCallback((slug: string) => {
    const current = read()
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [slug, ...current]
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
    window.dispatchEvent(new Event(EVENT))
  }, [])
  return { favorites, toggle, has: (slug: string) => favorites.includes(slug) }
}
