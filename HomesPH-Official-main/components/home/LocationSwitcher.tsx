"use client"

import { useEffect, useRef, useState } from 'react'
import { useSelectedLocation } from '@/hooks/use-selected-location'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

const SECTION_ROUTES = new Set(['buy', 'rent', 'projects', 'news'])
const STATIC_ROOT_SEGMENTS = new Set([
  'buy',
  'rent',
  'projects',
  'news',
  'contact-us',
  'login',
  'registration',
  'forgot-password',
  'legal',
  'developers',
  'search',
  'restaurant',
  'tourism',
  'our-company',
  'mortgage',
  'favorites',
  'dashboard',
])

function buildPathForLocation(pathname: string, slug?: string) {
  const segments = pathname.split('/').filter(Boolean)
  const locationPrefix = slug ? `/${slug}` : ''

  if (segments.length === 0) return slug ? `/${slug}` : '/'

  const first = segments[0]
  const second = segments[1]

  // Root section routes: /buy, /rent, /projects
  if (SECTION_ROUTES.has(first)) {
    return `${locationPrefix}/${first}`
  }

  // Location-prefixed section routes: /cebu/buy, /cebu/rent, /cebu/projects
  if (!STATIC_ROOT_SEGMENTS.has(first) && second && SECTION_ROUTES.has(second)) {
    return `${locationPrefix}/${second}`
  }

  return slug ? `/${slug}` : '/'
}

export default function LocationSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' | 'pill' }) {
  const { selectedLocation, setSelectedLocation, clearSelectedLocation } = useSelectedLocation()
  const [locations, setLocations] = useState<{ title: string; slug: string }[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/site-locations')
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setLocations(data)
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleSelect(slug: string) {
    setSelectedLocation(slug)
    setOpen(false)
    const basePath = buildPathForLocation(pathname, slug)
    const qs = searchParams.toString()
    const nextHref = qs ? `${basePath}?${qs}` : basePath

    if (nextHref === `${pathname}${qs ? `?${qs}` : ''}`) {
      router.refresh()
      return
    }

    router.replace(nextHref)
  }

  function handleSelectAll() {
    clearSelectedLocation()
    setOpen(false)
    const basePath = buildPathForLocation(pathname)
    const qs = searchParams.toString()
    const nextHref = qs ? `${basePath}?${qs}` : basePath

    if (nextHref === `${pathname}${qs ? `?${qs}` : ''}`) {
      router.refresh()
      return
    }

    router.replace(nextHref)
  }

  const isPill = variant === 'pill'
  const isDark = variant === 'dark'

  const displayLabel = selectedLocation
    ? locations.find((l) => l.slug === selectedLocation)?.title ?? selectedLocation
    : 'All'

  if (isPill) {
    return (
      <div className="relative hidden md:block" ref={ref}>
        <button
          onClick={() => setOpen((s) => !s)}
          className="flex items-center justify-center text-white/95 transition-colors hover:text-white hover:bg-white/10"
          style={{ width: 101, height: 25, border: '1px solid #FFFFFF', borderRadius: 5, background: 'transparent', cursor: 'pointer' }}
        >
          <span className="flex items-center gap-2 text-[12px] leading-[12px]">
            <span className="block w-1 h-1 rounded-full" style={{ background: '#FFCE70' }} />
            {displayLabel}
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {open && (
          <div className="absolute right-0 z-[1100] mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="max-h-64 overflow-auto py-1">
              <button
                onClick={handleSelectAll}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  !selectedLocation ? 'bg-blue-50 text-[#1428AE] font-semibold' : 'text-gray-700 hover:bg-gray-50 font-medium'
                }`}
              >
                All Locations
              </button>
              {locations.map((l) => (
                <button
                  key={l.slug}
                  onClick={() => handleSelect(l.slug)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedLocation === l.slug ? 'bg-blue-50 text-[#1428AE] font-semibold' : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  {l.title}
                </button>
              ))}
              {locations.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400">Loading...</div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className={`uppercase font-bold text-xs px-2.5 py-1 rounded-md border transition-colors ${
          isDark
            ? 'border-white/20 bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        📍 {selectedLocation ?? 'Select location'} ▼
      </button>

      {open && (
        <div className="absolute z-[1100] mt-2 w-56 bg-white border border-gray-100 rounded-md shadow-lg">
          <div className="max-h-64 overflow-auto">
            {locations.map((l) => (
              <button
                key={l.slug}
                onClick={() => handleSelect(l.slug)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 uppercase font-semibold"
              >
                {l.title}
              </button>
            ))}
            {locations.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500">No locations</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
