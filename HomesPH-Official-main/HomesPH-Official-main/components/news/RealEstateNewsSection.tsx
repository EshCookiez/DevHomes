'use client'

import { NewsCarousel } from './NewsCarousel'
import { MOCK_REAL_ESTATE_NEWS } from '@/lib/mock-data'

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

// No local dummy; use centralized mock dataset in mock-data.ts

export function RealEstateNewsSection({ articles }: RealEstateNewsSectionProps) {
  // Filter to get the most relevant real estate articles
  const realEstateArticles = articles
    .filter(
      article =>
        article.category &&
        [
          'Market Trends',
          'New Developments',
          'Regional Update',
          'Investment',
          'Sustainability',
        ].includes(article.category)
    )
    .slice(0, 13)

  // Prefer page data when there are enough items; otherwise top up with centralized mock data
  const mergeAndDedupe = (primary: Article[], fallback: Article[]) => {
    const map = new Map<string, Article>()
    for (const item of [...primary, ...fallback]) {
      const key = String(item.id)
      if (!map.has(key)) map.set(key, item)
    }
    return Array.from(map.values())
  }

  const hydratedList = realEstateArticles.length >= 9 ? realEstateArticles : mergeAndDedupe(realEstateArticles, MOCK_REAL_ESTATE_NEWS as unknown as Article[])
  const displayArticles = hydratedList.slice(0, 13)

  if (displayArticles.length === 0) {
    return null
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
