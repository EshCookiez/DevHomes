'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

interface Article {
  id: number | string
  title: string
  slug: string
  image_url?: string
  image?: string
  category?: string
  location?: string
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
  const [cardWidth, setCardWidth] = useState(280)
  const [gap, setGap] = useState(8)

  // Responsive card width and gap based on screen size
  useEffect(() => {
    const updateCardDimensions = () => {
      const width = window.innerWidth
      if (width < 640) {
        setCardWidth(220)
        setGap(8)
      } else if (width < 768) {
        setCardWidth(250)
        setGap(12)
      } else {
        setCardWidth(280)
        setGap(16)
      }
    }

    updateCardDimensions()
    window.addEventListener('resize', updateCardDimensions)
    return () => window.removeEventListener('resize', updateCardDimensions)
  }, [])

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
      const scrollAmount = cardWidth + gap
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
      <section className="py-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[120px] 2xl:px-[230px] bg-gray-50">
        <h2 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] font-semibold tracking-[-0.045em] text-[#002143]" style={{ fontFamily: 'Outfit' }}>
          Philippine Tourism
        </h2>
        <p className="mt-4 text-gray-500">Currently No Article Found</p>
      </section>
    )
  }

  return (
    <section className="py-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[120px] 2xl:px-[230px] bg-gray-50">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] font-semibold tracking-[-0.045em] text-[#002143]" style={{ fontFamily: 'Outfit' }}>
              Philippine Tourism
            </h2>
            <p className="mt-2 text-sm text-[#002143]" style={{ fontFamily: 'Outfit', fontWeight: 300 }}>
              Explore the finest destinations and attractions across the Philippines
            </p>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="inline-flex h-[32px] sm:h-[36px] md:h-[42px] w-[32px] sm:w-[36px] md:w-[42px] items-center justify-center rounded-full border border-[#d8e2f1] bg-white text-[#173260] transition-[transform,border-color,background-color,opacity] duration-320 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-[#c5d3eb] hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} className="sm:size-[18px]" strokeWidth={2.1} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="inline-flex h-[32px] sm:h-[36px] md:h-[42px] w-[32px] sm:w-[36px] md:w-[42px] items-center justify-center rounded-full border border-[#d8e2f1] bg-white text-[#173260] transition-[transform,border-color,background-color,opacity] duration-320 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-[#c5d3eb] hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} className="sm:size-[18px]" strokeWidth={2.1} />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-2 sm:gap-3 md:gap-4 overflow-hidden pb-2"
          style={{ scrollBehavior: 'smooth' }}
        >
          {displayArticles.map(article => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="group flex shrink-0 w-[220px] sm:w-[250px] md:w-[280px] flex-col overflow-hidden rounded-[12px] border border-[#e4ecf8] bg-white shadow-[0_14px_30px_rgba(15,39,78,0.06)] transition-[transform,box-shadow,border-color] duration-320 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:border-[#d8e2f1] hover:shadow-[0_22px_44px_rgba(15,39,78,0.08)] cursor-pointer"
            >
              <div className="relative h-[180px] overflow-hidden bg-[#e9eff8]">
                {getImage(article) ? (
                  <img
                    src={getImage(article)}
                    alt={article.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-800 via-[#1428ae] to-slate-950" />
                )}
                {/* News Badge & Date/Time */}
                <div className="absolute inset-0 flex flex-col justify-between p-3">
                  <div />
                  <div className="flex items-end justify-between">
                    <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'Outfit' }}>
                      News
                    </span>
                    {article.published_at && (
                      <span className="text-[11px] font-medium text-white drop-shadow-md text-right" style={{ fontFamily: 'Outfit' }}>
                        {formatDate(article.published_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col px-[14px] pb-[14px] pt-[12px]">
                <h3 className="line-clamp-2 text-[16px] font-medium leading-[1.3] text-[#002143] transition-colors duration-300 group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit' }}>
                  {article.title}
                </h3>

                <span className="mt-auto inline-flex items-center gap-[6px] pt-[10px] text-[12px] font-normal text-[#1428ae]" style={{ fontFamily: 'Outfit' }}>
                  <span>Read More</span>
                  <ArrowRight size={12} strokeWidth={2.2} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
