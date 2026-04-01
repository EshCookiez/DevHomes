'use client'

import { useId, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { serializeSelectedLocationCookie } from '@/lib/selected-location'

export interface Location {
  id: number
  title: string
  slug: string
  logo_url: string | null
  description: string | null
}

const LOCAL_LOCATION_ICONS: Record<string, string> = {
  bacolod: '/locationIcons/bacolod.png',
  bgc: '/locationIcons/BGC.png',
  bohol: '/locationIcons/Bohol.png',
  'cagayan-de-oro': '/locationIcons/Cagayan%20De%20Oro.png',
  cavite: '/locationIcons/Cavite.png',
  cebu: '/locationIcons/Cebu.png',
  davao: '/locationIcons/Davao.png',
  gensan: '/locationIcons/Gensan.png',
  iloilo: '/locationIcons/Iloilo.png',
  pampanga: '/locationIcons/Pampanga.png',
}

function LocationPinIcon() {
  const clipPathId = useId()

  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M7.5 7.03125C8.53553 7.03125 9.375 6.19178 9.375 5.15625C9.375 4.12072 8.53553 3.28125 7.5 3.28125C6.46447 3.28125 5.625 4.12072 5.625 5.15625C5.625 6.19178 6.46447 7.03125 7.5 7.03125Z"
          stroke="#748AA0"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.2504 7.03125C9.84417 10.3125 7.50042 14.0625 7.50042 14.0625C7.50042 14.0625 5.15667 10.3125 3.75042 7.03125C2.34417 3.75 4.68792 0.9375 7.50042 0.9375C10.3129 0.9375 12.6567 3.75 11.2504 7.03125Z"
          stroke="#748AA0"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width="15" height="15" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function getLocationImageSources(location: Location) {
  return [LOCAL_LOCATION_ICONS[location.slug], location.logo_url].filter(
    (source): source is string => Boolean(source),
  )
}

function getLocationInitials(title: string) {
  const parts = title
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) return 'HP'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function LocationCard({ location }: { location: Location }) {
  const router = useRouter()
  const imageSources = getLocationImageSources(location)
  const [imageIndex, setImageIndex] = useState(0)
  const currentImage = imageIndex < imageSources.length ? imageSources[imageIndex] : null
  const initials = getLocationInitials(location.title)

  function handleSelect(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    document.cookie = serializeSelectedLocationCookie(location.slug)
    router.push(`/${location.slug}`)
  }

  function handleImageError() {
    setImageIndex((current) => current + 1)
  }

  return (
    <Link
      href={`/${location.slug}`}
      onClick={handleSelect}
      className="group flex w-full cursor-pointer flex-col items-center rounded-[20px] bg-white px-4 py-6 text-center shadow-[0_0_4px_rgba(20,40,174,0.18)] transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2140d8]/20"
    >
      <div className="mx-auto flex h-[75px] w-[75px] items-center justify-center rounded-[15px] border border-[#DBE2E9] bg-[#F8FBFF]">
        {currentImage ? (
          <img
            src={currentImage}
            alt={`${location.title} icon`}
            className="h-[62px] w-[62px] object-contain"
            onError={handleImageError}
          />
        ) : (
          <span className="font-outfit text-[18px] font-semibold tracking-[0.18em] text-[#1428AE]">
            {initials}
          </span>
        )}
      </div>

      <h3 className="mt-4 font-outfit text-[16px] font-normal text-[#002143] sm:text-[18px]">
        {location.title}
      </h3>

      <p className="mt-2 font-outfit text-[13px] font-light text-[#748AA0] sm:text-[15px]">
        Philippines
      </p>
    </Link>
  )
}
