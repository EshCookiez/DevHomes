'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Location {
  title: string
  slug: string
}

interface CityNavigationProps {
  currentLocation: string
}

export function CityNavigation({ currentLocation }: CityNavigationProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/site-locations')
        if (!res.ok) return
        const data = await res.json()
        if (mounted) {
          setLocations(data)
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading || locations.length === 0) return null

  return (
    <section className="py-8 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[120px] 2xl:px-[230px]">
      <div className="w-full overflow-x-auto border border-[#D3D3D3] rounded-lg p-4">
        <div className="flex gap-3 min-w-max">
          {locations.map(location => {
            const isActive = currentLocation.toLowerCase() === location.slug.toLowerCase()

            return (
              <Link
                key={location.slug}
                href={`/${location.slug}/news`}
                className={`inline-flex px-5 py-3 rounded-lg font-semibold text-[18px] md:text-[20px] lg:text-[22px] transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#e8f0fe] text-[#1428ae] border-2 border-[#1428ae]'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
                style={{ fontFamily: 'Outfit' }}
              >
                {location.title}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
