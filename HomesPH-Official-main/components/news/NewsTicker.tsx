'use client'

import Link from 'next/link'
import { useRef, useEffect, useState } from 'react'
import { buildArticleHref } from '@/lib/article-href'

interface TickerItem {
  title: string
  slug: string
  city_slug?: string | null
}

interface NewsTickerProps {
  items: TickerItem[]
}

function truncate(text: string, maxWords = 4) {
  const words = text.split(/\s+/)
  return words.length <= maxWords ? text : words.slice(0, maxWords).join(' ') + '…'
}

function TickerLink({ item }: { item: TickerItem }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={buildArticleHref(item.slug, item.city_slug)}
      className="text-[14px] sm:text-[16px] md:text-[18px] font-normal whitespace-nowrap transition-colors duration-200"
      style={{ fontFamily: 'Outfit', color: hovered ? '#F4AA1D' : '#FFFFFF' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered ? item.title : truncate(item.title)}
    </Link>
  )
}

export function NewsTicker({ items }: NewsTickerProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)

  // We duplicate the list so the scroll loops seamlessly
  const doubled = [...items, ...items]

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let animationId: number
    let position = 0
    const speed = 0.5 // px per frame

    const step = () => {
      if (!pausedRef.current) {
        position += speed
        // When we've scrolled past the first copy, reset to 0 for seamless loop
        const halfWidth = track.scrollWidth / 2
        if (halfWidth > 0 && position >= halfWidth) {
          position = 0
        }
        track.style.transform = `translateX(-${position}px)`
      }
      animationId = requestAnimationFrame(step)
    }

    animationId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationId)
  }, [doubled.length])

  if (items.length === 0) return null

  return (
    <div
      className="w-full h-[40px] bg-[#1428AE] overflow-hidden"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      <div className="h-full flex items-center">
        <div ref={trackRef} className="flex items-center shrink-0 will-change-transform">
          {doubled.map((item, i) => (
            <span key={`ticker-${i}`} className="flex items-center shrink-0">
              {i > 0 && (
                <span className="inline-block w-[1.5px] h-[22px] bg-white mx-4 sm:mx-5" />
              )}
              <TickerLink item={item} />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
