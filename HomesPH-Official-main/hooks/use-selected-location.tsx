"use client"

import { useCallback, useEffect, useState } from 'react'
import { SELECTED_LOCATION_COOKIE } from '@/lib/selected-location'
import { normalizeLocationSlug } from '@/lib/url-slugs'

export function useSelectedLocation(initial?: string) {
  const [selectedLocation, setSelectedLocationState] = useState<string | undefined>(undefined)

  useEffect(() => {
    // priority: localStorage -> cookie -> initial
    try {
      const fromLocal = typeof window !== 'undefined' ? localStorage.getItem('selected_location') : null
      const localSlug = normalizeLocationSlug(fromLocal)
      if (localSlug) {
        try { localStorage.setItem('selected_location', localSlug) } catch {}
        try { document.cookie = `${SELECTED_LOCATION_COOKIE}=${encodeURIComponent(localSlug)}; path=/; max-age=${60 * 60 * 24 * 30}; sameSite=Lax` } catch {}
        setSelectedLocationState(localSlug)
        return
      }
    } catch {}

    try {
      const cookie = typeof document !== 'undefined' ? document.cookie : ''
      const match = cookie.match(new RegExp('(?:^|; )' + SELECTED_LOCATION_COOKIE + '=([^;]+)'))
      if (match) {
        const cookieSlug = normalizeLocationSlug(decodeURIComponent(match[1]))
        if (cookieSlug) {
          try { localStorage.setItem('selected_location', cookieSlug) } catch {}
          setSelectedLocationState(cookieSlug)
          return
        }
      }
    } catch {}

    const initialSlug = normalizeLocationSlug(initial)
    if (initialSlug) {
      try { localStorage.setItem('selected_location', initialSlug) } catch {}
      try { document.cookie = `${SELECTED_LOCATION_COOKIE}=${encodeURIComponent(initialSlug)}; path=/; max-age=${60 * 60 * 24 * 30}; sameSite=Lax` } catch {}
      setSelectedLocationState(initialSlug)
      return
    }
  }, [initial])

  const setSelectedLocation = useCallback((slug: string) => {
    const normalizedSlug = normalizeLocationSlug(slug)
    if (!normalizedSlug) {
      try { localStorage.removeItem('selected_location') } catch {}
      try { document.cookie = `${SELECTED_LOCATION_COOKIE}=; path=/; max-age=0; sameSite=Lax` } catch {}
      setSelectedLocationState(undefined)
      return
    }

    try { localStorage.setItem('selected_location', normalizedSlug) } catch {}
    try { document.cookie = `${SELECTED_LOCATION_COOKIE}=${encodeURIComponent(normalizedSlug)}; path=/; max-age=${60 * 60 * 24 * 30}; sameSite=Lax` } catch {}
    setSelectedLocationState(normalizedSlug)
  }, [])

  const clearSelectedLocation = useCallback(() => {
    try { localStorage.removeItem('selected_location') } catch {}
    try { document.cookie = `${SELECTED_LOCATION_COOKIE}=; path=/; max-age=0; sameSite=Lax` } catch {}
    setSelectedLocationState(undefined)
  }, [])

  return { selectedLocation, setSelectedLocation, clearSelectedLocation }
}
