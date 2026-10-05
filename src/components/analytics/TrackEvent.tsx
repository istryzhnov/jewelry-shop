'use client'

import { useEffect, useRef } from 'react'

import { track } from '@/lib/analytics'

type Props = Parameters<typeof track>

export function TrackEvent({ event, params }: { event: Props[0]; params: Props[1] }) {
  const key = JSON.stringify(params)
  const sent = useRef<string | null>(null)
  useEffect(() => {
    // Guards against StrictMode double effects
    if (sent.current === key) return
    sent.current = key
    track(event, JSON.parse(key))
  }, [event, key])
  return null
}
