'use client'

import { NewsCarousel } from './NewsCarousel'

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

interface RealEstateNewsSectionProps {
  articles: Article[]
}

const REAL_ESTATE_CATEGORIES = [
  'real estate',
  'market trends',
  'new developments',
  'regional update',
  'investment',
  'sustainability',
]

export function RealEstateNewsSection({ articles }: RealEstateNewsSectionProps) {
  const displayArticles = articles
    .filter(
      article =>
        article.category &&
        REAL_ESTATE_CATEGORIES.includes(article.category.toLowerCase())
    )
    .slice(0, 13)

  if (displayArticles.length === 0) {
    return (
      <section className="py-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[120px] 2xl:px-[230px]">
        <h2 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] font-semibold tracking-[-0.045em] text-[#002143]" style={{ fontFamily: 'Outfit' }}>
          Real Estate Latest News
        </h2>
        <p className="mt-4 text-gray-500">Currently No Article Found</p>
      </section>
    )
  }

  return (
    <NewsCarousel
      items={displayArticles}
      title="Real Estate Latest News"
      description="Stay updated with the latest trends, developments, and market insights in Philippine real estate"
      showNavigation={true}
    />
  )
}
