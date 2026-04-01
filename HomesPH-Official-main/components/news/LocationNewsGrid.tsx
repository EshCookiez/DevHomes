'use client'

import { NewsCarousel } from './NewsCarousel'

interface Article {
  id: number | string
  title?: string
  name?: string
  slug: string
  image_url?: string
  image?: string
  category?: string
  location?: string
  city?: string
  published_at?: string
  excerpt?: string
  summary?: string
}

interface LocationNewsGridProps {
  articles: Article[]
  title: string
  description?: string
}

export function LocationNewsGrid({
  articles,
  title,
  description,
}: LocationNewsGridProps) {
  if (articles.length === 0) {
    return null
  }

  // Transform articles to ensure title is always set (use name as fallback)
  const transformedArticles = articles.map(article => ({
    ...article,
    title: article.title || article.name || 'Untitled',
  }))

  return (
    <NewsCarousel
      items={transformedArticles}
      title={title}
      description={description}
      showNavigation={true}
    />
  )
}
