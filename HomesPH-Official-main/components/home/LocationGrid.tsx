'use client'

import { useState, useEffect } from 'react'
import { LocationCard, type Location } from './LocationCard'

const LANDING_LOCATION_ORDER = [
  'davao',
  'gensan',
  'cagayan-de-oro',
  'butuan',
  'surigao',
  'ozamis',
  'bohol',
  'dumaguete',
  'bacolod',
  'cebu',
  'iloilo',
  'bgc',
  'cavite',
  'manila',
  'pampanga',
  'taguig',
  'laguna',
  'others',
]

// Only cycle the URLs that have been successfully mapped/uploaded to the bucket
const FEATURED_BACKGROUND_SLUGS = ['cebu', 'davao', 'surigao', 'butuan', 'cagayan-de-oro']

const getBgUrl = (slug: string) => {
  if (slug === 'cebu') {
    return 'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/Locations/cebu.png'
  }
  if (slug === 'davao') {
    return 'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/Locations/Davao.png'
  }
  
  const title =
    slug === 'cagayan-de-oro'
      ? 'Cagayan De Oro'
      : slug === 'bgc'
      ? 'BGC'
      : slug.charAt(0).toUpperCase() + slug.slice(1)
      
  return `https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/Locations/${encodeURIComponent(title)}.png`
}

export default function LocationGrid({ locations }: { locations: Location[] }) {
  const [bgIndex, setBgIndex] = useState<number>(0)

  // Automatic ambient background slideshow (swaps every 3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((current) => (current + 1) % FEATURED_BACKGROUND_SLUGS.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const displayLocations = LANDING_LOCATION_ORDER.map((slug, index) => {
    const existing = locations.find((l) => l.slug === slug)
    if (existing) return existing

    const formatTitle = (s: string) => {
      if (s === 'cagayan-de-oro') return 'Cagayan De Oro'
      if (s === 'bgc') return 'BGC'
      return s.charAt(0).toUpperCase() + s.slice(1)
    }

    return {
      id: -(index + 1),
      title: formatTitle(slug),
      slug: slug,
      logo_url: null,
      description: null,
    }
  })

  return (
    <section
      id="locations"
      className="relative overflow-hidden bg-[#0D1019] py-12 md:py-20 xl:block xl:h-[929px] xl:py-0 xl:pt-[100px]"
    >
      {/* Automated Background Layers */}
      {FEATURED_BACKGROUND_SLUGS.map((slug, idx) => (
        <div
          key={`bg-${slug}`}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
            bgIndex === idx ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${getBgUrl(slug)}')` }}
        />
      ))}
      <div className="absolute inset-0 bg-[#0D1019]/[0.35]" />
      <div className="absolute inset-x-0 top-0 z-10 h-px bg-slate-200/80" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full px-4 md:px-8 xl:max-w-[1920px] xl:px-0">
        <div className="mx-auto flex w-full max-w-[1002px] flex-col items-center text-center">
          <h1 className="font-[family-name:var(--font-outfit)] text-[40px] font-semibold leading-[1] text-white sm:text-[55px] md:text-[65px] lg:text-[75px] lg:leading-[75px]">
            Discover Your Ideal Location
          </h1>
        </div>

        <div className="mx-auto mt-12 grid w-full max-w-[1345px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:mt-[80px] xl:gap-x-[28px] xl:gap-y-[25px]">
          {displayLocations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      </div>
    </section>
  )
}
