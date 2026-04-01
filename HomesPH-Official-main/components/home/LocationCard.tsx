'use client'

import { type MouseEvent } from 'react'
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

export function LocationCard({ location }: { location: Location }) {
  const router = useRouter()

  function handleSelect(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    document.cookie = serializeSelectedLocationCookie(location.slug)
    router.push(`/${location.slug}`)
  }

  return (
    <Link
      href={`/${location.slug}`}
      onClick={handleSelect}
      className="group mx-auto flex h-[50px] w-full max-w-[315.27px] cursor-pointer items-center justify-center rounded-[50px] bg-white transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2140d8]/20"
    >
      <span className="font-[family-name:var(--font-outfit)] text-[18px] font-medium leading-[25px] text-[#1428AE] uppercase lg:text-[25px]">
        {location.title}
      </span>
    </Link>
  )
}
