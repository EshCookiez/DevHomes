"use client"

import { useCallback, useEffect, useState } from 'react'
import { SELECTED_LOCATION_COOKIE } from '@/lib/selected-location'

export function useSelectedLocation(initial?: string) {
  const [selectedLocation, setSelectedLocationState] = useState<string | undefined>(undefined)

  useEffect(() => {
    // priority: localStorage -> cookie -> initial
    try {
      const fromLocal = typeof window !== 'undefined' ? localStorage.getItem('selected_location') : null
      if (fromLocal) {
        setSelectedLocationState(fromLocal)
        return
      }
    } catch {}

    try {
      const cookie = typeof document !== 'undefined' ? document.cookie : ''
      const match = cookie.match(new RegExp('(?:^|; )' + SELECTED_LOCATION_COOKIE + '=([^;]+)'))
      if (match) {
        setSelectedLocationState(decodeURIComponent(match[1]))
        return
      }
    } catch {}

    if (initial) setSelectedLocationState(initial)
  }, [initial])

  const setSelectedLocation = useCallback((slug: string) => {
    try { localStorage.setItem('selected_location', slug) } catch {}
    try { document.cookie = `${SELECTED_LOCATION_COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=${60 * 60 * 24 * 30}; sameSite=Lax` } catch {}
    setSelectedLocationState(slug)
  }, [])

  const clearSelectedLocation = useCallback(() => {
    try { localStorage.removeItem('selected_location') } catch {}
    try { document.cookie = `${SELECTED_LOCATION_COOKIE}=; path=/; max-age=0; sameSite=Lax` } catch {}
    setSelectedLocationState(undefined)
  }, [])

  return { selectedLocation, setSelectedLocation, clearSelectedLocation }
}
