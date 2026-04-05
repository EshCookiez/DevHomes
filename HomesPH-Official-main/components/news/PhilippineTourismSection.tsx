'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buildArticleHref } from '@/lib/article-href'

interface Article {
  id: number | string
  title: string
  slug: string
  image_url?: string
  image?: string
  category?: string
  location?: string
  city_slug?: string | null
  published_at?: string
  excerpt?: string
  summary?: string
}

interface PhilippineTourismSectionProps {
  articles: Article[]
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const day = date.getDate()
  const year = date.getFullYear()
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${month} ${day}, ${year} | ${time}`
}

function getImage(article: Article) {
  return article.image_url ?? article.image ?? ''
}

export function PhilippineTourismSection({
  articles,
}: PhilippineTourismSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Filter tourism articles and limit to 13
  const displayArticles = articles
    .filter(
      article =>
        article.category &&
        article.category.toLowerCase().includes('tourism')
    )
    .slice(0, 13)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 305 // 290px card + 15px gap
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount)
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      })
      setTimeout(checkScroll, 500)
    }
  }

  if (displayArticles.length === 0) {
    return (
      <section className="py-0 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[230px] bg-white">
        <h2 className="text-[35px] leading-[35px] font-medium text-[#002143]" style={{ fontFamily: 'Outfit' }}>
          Philippine Tourism
        </h2>
        <p className="mt-4 text-gray-500">Currently No Article Found</p>
      </section>
    )
  }

  return (
    <section className="py-0 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[230px] bg-white">
      <div className="w-full">
        {/* Header */}
        <div className="mb-[30px] flex items-center justify-between">
          <h2
            className="text-[35px] leading-[35px] font-medium text-[#002143]"
            style={{ fontFamily: 'Outfit' }}
          >
            Philippine Tourism
          </h2>
          <div className="flex items-center gap-[20px]">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="flex items-center justify-center w-[24px] h-[24px] disabled:opacity-40"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} strokeWidth={1.5} color={canScrollLeft ? '#002143' : '#98A7B7'} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="flex items-center justify-center w-[24px] h-[24px] disabled:opacity-40"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} strokeWidth={1.5} color={canScrollRight ? '#002143' : '#98A7B7'} />
            </button>
          </div>
        </div>

        {/* Carousel with right fade */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-[15px] overflow-hidden"
            style={{ scrollBehavior: 'smooth' }}
          >
            {displayArticles.map(article => (
              <Link
                key={article.id}
                href={buildArticleHref(article.slug, article.city_slug)}
                className="group flex shrink-0 w-[290px] h-[350px] flex-col overflow-hidden rounded-[15px] bg-white shadow-[0px_1px_5px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0px_4px_12px_rgba(0,0,0,0.2)]"
              >
                {/* Image area */}
                <div className="relative h-[256px] overflow-hidden bg-[#D9D9D9]" style={{ borderRadius: '15px 15px 10px 10px' }}>
                  {getImage(article) ? (
                    <img
                      src={getImage(article)}
                      alt={article.title}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-800 via-[#1428ae] to-slate-950" />
                  )}
                  {/* Gradient overlay – 75px */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-[75px]"
                    style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000000 100%)', borderRadius: '0 0 10px 10px' }}
                  />
                  {/* Badge */}
                  <span
                    className="absolute left-[15px] bottom-[15px] inline-flex items-center justify-center w-[72px] h-[20px] rounded-[10px] bg-[#3682E1] text-[12px] leading-[12px] font-normal text-white text-center"
                    style={{ fontFamily: 'Outfit' }}
                  >
                    News
                  </span>
                  {/* Date */}
                  {article.published_at && (
                    <span
                      className="absolute right-[15px] bottom-[20px] text-[10px] leading-[10px] font-light text-white text-center"
                      style={{ fontFamily: 'Outfit' }}
                    >
                      {formatDate(article.published_at)}
                    </span>
                  )}
                </div>

                {/* Content area */}
                <div className="flex flex-1 flex-col px-[15px] pt-[8px] pb-[15px]">
                  <h3
                    className="line-clamp-2 text-[15px] font-medium leading-[20px] text-[#002143] transition-colors duration-300 group-hover:text-[#1428ae]"
                    style={{ fontFamily: 'Outfit' }}
                  >
                    {article.title}
                  </h3>
                  <span
                    className="mt-auto text-[12px] leading-[12px] font-normal text-[#1428AE]"
                    style={{ fontFamily: 'Outfit' }}
                  >
                    READ MORE
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {/* Right fade overlay */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-[39px]"
            style={{ background: 'linear-gradient(270deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)' }}
          />
        </div>
      </div>
    </section>
  )
}
