'use client'

import { useEffect, useState } from 'react'
import { LocationNewsGrid } from './LocationNewsGrid'

interface Location {
  title: string
  slug: string
}

interface Article {
  id: number | string
  title?: string
  name?: string
  slug: string
  image_url?: string
  image?: string
  category?: string
  location?: string
  city?: string | null
  published_at?: string
  excerpt?: string
  summary?: string
  description?: string
  tags?: string[]
  topics?: string[]
}

function isRealEstate(article: Article) {
  const cat = (article.category ?? '').toLowerCase()
  return cat === 'real estate' || cat === 'property' || cat === 'housing'
}

function matchesCity(article: Article, city: string) {
  const normalized = city.toLowerCase().replace(/-/g, ' ')
  // Use word-boundary regex to avoid partial matches (e.g. "cavite" matching "cavitex")
  const pattern = new RegExp(`\\b${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  const values = [
    article.title,
    article.summary,
    article.excerpt,
    article.description,
    article.location,
    article.city,
    ...(article.tags ?? []),
    ...(article.topics ?? []),
  ]
  return values.some(v => v ? pattern.test(v) : false)
}

function formatCityName(slug: string) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

interface CityNewsExplorerProps {
  allArticles: Article[]
  currentLocation: string
}

export function CityNewsExplorer({
  allArticles,
  currentLocation,
}: CityNewsExplorerProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCity, setSelectedCity] = useState(currentLocation)

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
    return () => {
      mounted = false
    }
  }, [])

  const filteredArticles = selectedCity
    ? allArticles.filter(a => isRealEstate(a) && matchesCity(a, selectedCity))
    : []

  const displayName = formatCityName(selectedCity || currentLocation)

  if (loading || locations.length === 0) return null

  return (
    <div>
      {/* City Navigation Buttons */}
      <section className="py-8 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[120px] 2xl:px-[230px]">
        <div className="w-full overflow-x-auto border border-[#D3D3D3] rounded-lg p-4">
          <div className="flex gap-3 min-w-max">
            {locations.map(location => {
              const isActive =
                selectedCity.toLowerCase() === location.slug.toLowerCase()

              return (
                <button
                  key={location.slug}
                  type="button"
                  onClick={() => setSelectedCity(location.slug)}
                  className={`inline-flex px-5 py-3 rounded-lg font-semibold text-[18px] md:text-[20px] lg:text-[22px] transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#e8f0fe] text-[#1428ae] border-2 border-[#1428ae]'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'Outfit' }}
                >
                  {location.title}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Location-specific Real Estate News */}
      {filteredArticles.length > 0 ? (
        <LocationNewsGrid
          key={selectedCity}
          articles={filteredArticles as any[]}
          title={`${displayName} Real Estate Latest`}
        />
      ) : (
        <div className="py-16 text-center px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[120px] 2xl:px-[230px]">
          <p className="text-xl font-extrabold text-gray-700">
            No Real Estate News Found for {displayName}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            There are currently no real estate news articles available for{' '}
            <span className="font-semibold text-gray-700">{displayName}</span>.
            Check back later for updates.
          </p>
        </div>
      )}
    </div>
  )
}
