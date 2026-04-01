'use client'

import { NewsCarousel } from './NewsCarousel'
import { MOCK_OFW_NEWS } from '@/lib/mock-data'

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
  tags?: string[]
}

interface OFWNewsSectionProps {
  articles: Article[]
}

// No local dummy; use central mock dataset in mock-data.ts

export function OFWNewsSection({ articles }: OFWNewsSectionProps) {
  // Filter to get articles relevant to OFWs (Overseas Filipino Workers)
  const ofwArticles = articles
    .filter(
      article =>
        article.tags?.includes('OFW') ||
        article.category === 'Guides' ||
        (article.title && article.title.toLowerCase().includes('ofw'))
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

  const hydratedList = ofwArticles.length >= 9 ? ofwArticles : mergeAndDedupe(ofwArticles, MOCK_OFW_NEWS as unknown as Article[])
  const displayArticles = hydratedList.slice(0, 13)

  if (displayArticles.length === 0) {
    return null
  }

  return (
    <NewsCarousel
      items={displayArticles}
      title="OFW News Update"
      description="Resources, opportunities, and market insights tailored for Overseas Filipino Workers investing in Philippine real estate"
      showNavigation={true}
    />
  )
}
