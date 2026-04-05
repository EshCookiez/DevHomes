import Link from 'next/link'
import { cookies } from 'next/headers'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import { SELECTED_LOCATION_COOKIE } from '@/lib/selected-location'
import { formatLocationForNews } from '@/lib/news-navigation'
import { getArticles as getArticlesFromAPI } from '@/lib/hybrid-articles'
import { NewsTicker } from '@/components/news/NewsTicker'
import AdBanner from '@/components/ui/AdBanner'
import { buildArticleHref } from '@/lib/article-href'

interface Article {
  id: number | string
  title: string
  slug: string
  summary?: string
  excerpt?: string
  description?: string
  category?: string
  image_url?: string
  image?: string
  author?: string
  published_at: string
  read_time?: number
  tags?: string[]
  topics?: string[]
  location?: string
  city?: string | null
  city_slug?: string | null
  is_live?: boolean
  views_count?: number
}

interface ArticleCollection {
  articles: Article[]
  total: number
  currentPage: number
  lastPage: number
  perPage: number
}

// Locations that should include each other's articles
const RELATED_LOCATIONS: Record<string, string[]> = {
  bgc: ['taguig'],
  taguig: ['bgc'],
}

function getRelatedLocations(location: string): string[] {
  return RELATED_LOCATIONS[normalizeValue(location)] ?? []
}

const LOCATION_KEYWORDS = [
  'Metro Manila',
  'BGC',
  'Taguig',
  'Makati',
  'Pasig',
  'Pasay',
  'Cebu',
  'Iloilo',
  'Bacolod',
  'Bohol',
  'Davao',
  'Cagayan de Oro',
  'Pampanga',
  'Laguna',
  'Cavite',
]

function normalizeValue(value?: string | null) {
  return decodeURIComponent(value ?? '').trim().toLowerCase()
}

function getExcerpt(article: Article) {
  return article.summary ?? article.excerpt ?? article.description ?? ''
}

function getImage(article: Article) {
  return article.image_url ?? article.image ?? ''
}

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(value)
}

function uniqueStrings(values: Array<string | null | undefined>) {
  const map = new Map<string, string>()
  for (const value of values) {
    const trimmed = value?.trim()
    if (!trimmed) continue
    const key = normalizeValue(trimmed)
    if (!key || key === 'all') continue
    if (!map.has(key)) map.set(key, trimmed)
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b))
}

function inferLocation(article: Article) {
  const candidates = [article.location, article.city, ...(article.tags ?? []), ...(article.topics ?? [])]
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeValue(candidate)
    if (!normalizedCandidate) continue
    const exactKeyword = LOCATION_KEYWORDS.find(keyword => normalizeValue(keyword) === normalizedCandidate)
    if (exactKeyword) return exactKeyword
    const partialKeyword = LOCATION_KEYWORDS.find(keyword => {
      const normalizedKeyword = normalizeValue(keyword)
      return normalizedCandidate.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedCandidate)
    })
    if (partialKeyword) return partialKeyword
  }
  return article.location ?? article.city ?? undefined
}

function normalizeArticle(article: Article): Article {
  return {
    ...article,
    location: article.location ?? inferLocation(article),
    topics: uniqueStrings([...(article.topics ?? []), ...(article.tags ?? [])]),
    tags: uniqueStrings(article.tags ?? []),
    views_count: article.views_count ?? 0,
  }
}

function matchesLocation(article: Article, location: string) {
  const normalizedLocation = normalizeValue(location)
  if (!normalizedLocation) return false
  const locationsToMatch = [normalizedLocation, ...getRelatedLocations(normalizedLocation)]
  const values = [article.location, article.city, ...(article.tags ?? []), ...(article.topics ?? [])]
  return values.some(value => {
    const normalized = normalizeValue(value)
    if (!normalized) return false
    return locationsToMatch.some(loc => normalized.includes(loc) || loc.includes(normalized))
  })
}

function sortByNewest(a: Article, b: Article) {
  return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
}

function sortByViews(a: Article, b: Article) {
  return (b.views_count ?? 0) - (a.views_count ?? 0) || sortByNewest(a, b)
}

function dedupeArticles(articles: Article[]) {
  const seen = new Map<string, Article>()
  for (const article of articles) {
    const key = String(article.id)
    if (!seen.has(key)) seen.set(key, article)
  }
  return [...seen.values()]
}

function groupArticles(articles: Article[], getKey: (article: Article) => string | null | undefined) {
  const groups = new Map<string, Article[]>()
  for (const article of articles) {
    const key = getKey(article)?.trim()
    if (!key) continue
    const list = groups.get(key) ?? []
    list.push(article)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([key, items]) => ({ key, items: items.sort(sortByNewest) }))
}

function extractArticleCollection(payload: unknown): ArticleCollection {
  if (Array.isArray(payload)) {
    return {
      articles: payload as Article[],
      total: payload.length,
      currentPage: 1,
      lastPage: 1,
      perPage: payload.length,
    }
  }

  const source = (payload ?? {}) as Record<string, unknown>
  const nested = source.data && !Array.isArray(source.data) ? (source.data as Record<string, unknown>) : undefined
  const articles = Array.isArray(source.data)
    ? (source.data as Article[])
    : Array.isArray(source.articles)
      ? (source.articles as Article[])
      : Array.isArray(nested?.data)
        ? (nested.data as Article[])
        : []

  const metaSource = nested && Array.isArray(nested.data) ? nested : source

  return {
    articles,
    total: Number(metaSource.total ?? articles.length),
    currentPage: Number(metaSource.current_page ?? 1),
    lastPage: Number(metaSource.last_page ?? 1),
    perPage: Number(metaSource.per_page ?? (articles.length || 1)),
  }
}

// â”€â”€ Image helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function NewsImage({ article, className }: { article: Article; className: string }) {
  const image = getImage(article)
  if (!image) {
    return <div className={`${className} bg-gradient-to-br from-[#1428ae]/80 to-[#002143]`} />
  }
  return <img src={image} alt={article.title} className={`${className} object-cover`} />
}

// â”€â”€ Left column (295px) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LeftColumn({ leadStory, localLatest }: { leadStory?: Article; localLatest: Article[] }) {
  return (
    <div className="flex flex-col gap-0">
      {leadStory ? (
        <Link href={buildArticleHref(leadStory.slug, leadStory.city_slug)} className="group block overflow-hidden mb-5">
          <div className="relative w-full overflow-hidden rounded-[10px] bg-[#D9D9D9]" style={{ height: 181 }}>
            <NewsImage article={leadStory} className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="pt-3">
            <p
              className="line-clamp-2 font-[500] text-[18px] leading-[25px] group-hover:text-[#1428ae] transition-colors"
              style={{ fontFamily: 'Outfit', color: '#002143' }}
            >
              {leadStory.title}
            </p>
          </div>
        </Link>
      ) : null}
      <div className="space-y-4">
        {localLatest.slice(0, 5).map((article, index) => (
          <div key={article.id}>
            <Link href={buildArticleHref(article.slug, article.city_slug)} className="group block">
              <p className="text-left line-clamp-2 text-base font-bold transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
                {article.title}
              </p>
            </Link>
            {index < 4 && <div className="mb-[15px] border-b border-gray-300"></div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// â”€â”€ Middle column (677px) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MiddleColumn({ leadStory, leadRest = [] }: { leadStory?: Article; leadRest?: Article[] }) {
  const textArticle = leadRest[0]
  const gridArticles = leadRest.slice(1, 4)

  return (
    <div className="flex flex-col gap-0">
      {leadStory ? (
        <Link href={buildArticleHref(leadStory.slug, leadStory.city_slug)} className="group block overflow-hidden">
          <div className="relative overflow-hidden rounded-[15px] bg-[#D9D9D9]" style={{ height: 328 }}>
            <NewsImage article={leadStory} className="w-full h-full transition-transform duration-700 group-hover:scale-105" />
            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 rounded-b-[15px]" style={{ height: 184, background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000000 100%)' }} />
            {/* LIVE UPDATES badge */}
            <div className="absolute left-5" style={{ bottom: 35 }}>
              <span
                className="inline-flex items-center gap-2 px-4 py-2 text-[15px] font-[600]"
                style={{
                  fontFamily: 'Outfit',
                  background: 'linear-gradient(90deg, #1428AE 0%, #004D9D 100%)',
                  borderRadius: 20,
                  color: '#FFFFFF',
                  lineHeight: '15px',
                }}
              >
                <span className="inline-block rounded-full bg-white" style={{ width: 5, height: 5 }} />
                LIVE UPDATES
              </span>
            </div>
          </div>
          <div className="pt-5 pb-3">
            <h2
              className="line-clamp-2 font-[500] text-[20px] leading-[28px] group-hover:text-[#1428ae] transition-colors"
              style={{ fontFamily: 'Outfit', color: '#002143' }}
            >
              {leadStory.title}
            </h2>
          </div>
        </Link>
      ) : null}

      <div className="border-b border-[#D0D0D0] mb-4" />

      {textArticle ? (
        <Link href={buildArticleHref(textArticle.slug, textArticle.city_slug)} className="group block mb-4">
          <p
            className="line-clamp-2 font-[300] text-[18px] leading-[18px] group-hover:text-[#1428ae] transition-colors"
            style={{ fontFamily: 'Outfit', color: '#002143' }}
          >
            {textArticle.title}
          </p>
        </Link>
      ) : null}

      {gridArticles.length > 0 ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {gridArticles.map(article => (
            <div key={article.id} className="flex flex-col gap-2">
              <Link href={buildArticleHref(article.slug, article.city_slug)} className="group block">
                <div className="overflow-hidden rounded-[5px] bg-[#D9D9D9]" style={{ height: 126 }}>
                  <NewsImage article={article} className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
                </div>
                <p
                  className="mt-2 line-clamp-2 font-[300] text-[12px] leading-[15px] group-hover:text-[#1428ae] transition-colors"
                  style={{ fontFamily: 'Outfit', color: '#002143' }}
                >
                  {article.title}
                </p>
              </Link>
              <Link
                href={buildArticleHref(article.slug, article.city_slug)}
                className="inline-block font-[400] text-[12px] leading-[12px] hover:opacity-70 transition-opacity"
                style={{ fontFamily: 'Outfit', color: '#1428AE' }}
              >
                READ MORE
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// â”€â”€ Right column (295px) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RightColumn({ leadRest }: { leadRest: Article[] }) {
  const featured = leadRest[3]
  const catchUpItems = leadRest.slice(4, 7)

  return (
    <div className="flex flex-col gap-0">
      {featured ? (
        <Link href={buildArticleHref(featured.slug, featured.city_slug)} className="group block overflow-hidden mb-5">
          <div className="relative w-full overflow-hidden rounded-[10px] bg-[#D9D9D9]" style={{ height: 181 }}>
            <NewsImage article={featured} className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="pt-3">
            <p className="line-clamp-2 font-[500] text-[18px] leading-[25px] group-hover:text-[#1428ae] transition-colors" style={{ fontFamily: 'Outfit', color: '#002143' }}>
              {featured.title}
            </p>
          </div>
        </Link>
      ) : null}

      <div>
        <div className="mb-3 border-t border-[#D0D0D0]" />
        <p
          className="mb-4 font-[500] text-[20px] leading-[20px]"
          style={{ fontFamily: 'Outfit', color: '#002143' }}
        >
          Catch up on today&apos;s news
        </p>
        <div className="space-y-0">
          {catchUpItems.map((article, index) => (
            <div key={article.id}>
              <Link href={buildArticleHref(article.slug, article.city_slug)} className="group flex gap-3 items-start">
                <div className="shrink-0 overflow-hidden rounded-[5px] bg-[#D9D9D9]" style={{ width: 128, height: 79 }}>
                  <NewsImage article={article} className="w-full h-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="line-clamp-4 font-[300] text-[15px] leading-[20px] group-hover:text-[#1428ae] transition-colors"
                    style={{ fontFamily: 'Outfit', color: '#002143' }}
                  >
                    {article.title}
                  </p>
                </div>
              </Link>
              {index < catchUpItems.length - 1 && <div className="my-3 border-b border-[#D0D0D0]" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

async function fetchArticleCollection(location?: string, page = 1, limit = 40): Promise<ArticleCollection> {
  try {
    const result = await getArticlesFromAPI({
      city_slug: location && location !== 'All' ? location : undefined,
      per_page: limit,
      page,
    })
    const articles = result.data.data.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      excerpt: article.summary,
      description: article.description,
      category: article.category,
      image_url: article.image,
      image: article.image,
      author: article.author,
      published_at: article.published_at,
      read_time: undefined,
      tags: article.topics,
      topics: article.topics,
      location: article.location || article.city_name,
      city: article.city_name || null,
      city_slug: article.city_slug || null,
      is_live: true,
      views_count: article.views_count,
    })) as Article[]
    return {
      articles,
      total: result.data.total,
      currentPage: result.data.current_page,
      lastPage: result.data.last_page,
      perPage: result.data.per_page,
    }
  } catch {
    return {
      articles: [],
      total: 0,
      currentPage: 1,
      lastPage: 1,
      perPage: 0,
    }
  }
}

async function getArticles(location?: string): Promise<ArticleCollection> {
  try {
    const firstPage = await fetchArticleCollection(location, 1, 40)
    if (firstPage.lastPage <= 1) return firstPage

    const remainingPages = await Promise.all(
      Array.from({ length: Math.min(firstPage.lastPage, 12) - 1 }, (_, index) =>
        fetchArticleCollection(location, index + 2, firstPage.perPage || 40)
      )
    )

    return {
      ...firstPage,
      articles: [firstPage, ...remainingPages].flatMap(page => page.articles),
      total: Math.max(firstPage.total, [firstPage, ...remainingPages].reduce((count, page) => count + page.articles.length, 0)),
      lastPage: Math.max(firstPage.lastPage, ...remainingPages.map(page => page.lastPage)),
    }
  } catch {
    return {
      articles: [],
      total: 0,
      currentPage: 1,
      lastPage: 1,
      perPage: 0,
    }
  }
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ location: string }>
}) {
  const { location: routeLocation } = await params
  const cookieStore = await cookies()
  const cookieLocation = cookieStore.get(SELECTED_LOCATION_COOKIE)?.value
  const manualLocation = routeLocation && routeLocation !== 'All' ? formatLocationForNews(routeLocation) : undefined
  const savedLocation = cookieLocation ? decodeURIComponent(cookieLocation) : undefined
  const focusedLocation = manualLocation ?? savedLocation

  // Format location name for display (e.g., "cebu" -> "Cebu")
  const locationDisplayName = (focusedLocation ?? routeLocation ?? '')
    .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // Fetch city-specific articles using city_slug (including related locations)
  const relatedSlugs = focusedLocation ? getRelatedLocations(focusedLocation) : []
  const [settings, cityFeed, allFeed, ...relatedFeeds] = await Promise.all([
    getSiteSettings(),
    focusedLocation
      ? fetchArticleCollection(focusedLocation, 1, 100)
      : Promise.resolve({ articles: [], total: 0, currentPage: 1, lastPage: 1, perPage: 0 }),
    fetchArticleCollection(undefined, 1, 100),
    ...relatedSlugs.map(slug => fetchArticleCollection(slug, 1, 100)),
  ])

  // City-specific articles: prefer API city_slug results, then client-side matching
  const relatedArticles = relatedFeeds.flatMap(feed => feed.articles)
  const cityArticles = dedupeArticles(
    [...cityFeed.articles, ...relatedArticles, ...allFeed.articles.filter(a => matchesLocation(a, focusedLocation ?? routeLocation))]
      .map(normalizeArticle)
  ).sort(sortByNewest)

  // All articles for fallback sections (carousels etc.)
  const allArticles = dedupeArticles([...cityFeed.articles, ...allFeed.articles].map(normalizeArticle)).sort(sortByNewest)

  // Use city articles as the primary feed
  const leadFeed = cityArticles.length > 0 ? cityArticles : allArticles

  const [leadStory, ...leadRest] = leadFeed
  const localLatest = leadRest.slice(0, 5)

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Outfit' }}>
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      {/* â”€â”€ News Ticker Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <NewsTicker items={allArticles.slice(0, 12).map(a => ({ title: a.title, slug: a.slug, city_slug: a.city_slug }))} />

      <main className="w-full bg-white">
        {/* â”€â”€ 3-Column Hero Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="mx-auto w-full px-4 sm:px-6 md:px-8 xl:px-[120px] 2xl:px-[296px] pt-8 pb-0">
          {cityArticles.length === 0 ? (
            <div className="py-28 text-center">
              <p className="text-2xl font-extrabold" style={{ color: '#002143' }}>No Articles Found</p>
              <p className="mt-2" style={{ color: '#666666' }}>
                There are currently no news articles available for{' '}
                <span className="font-semibold" style={{ color: '#002143' }}>{locationDisplayName}</span>.
              </p>
              <Link
                href="/news"
                className="mt-6 inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold transition-colors hover:opacity-90"
                style={{ background: '#1428AE' }}
              >
                Browse All News
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-[295px_1fr_295px]">
              <LeftColumn leadStory={leadStory} localLatest={localLatest} />
              <MiddleColumn leadStory={leadStory} leadRest={leadRest} />
              <RightColumn leadRest={leadRest} />
            </div>
          )}
        </div>

        {/* â”€â”€ Ad Space â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="mx-auto w-full px-4 sm:px-6 md:px-8 xl:px-[120px] 2xl:px-[296px] mt-10">
          <AdBanner />
        </div>

        {/* â”€â”€ Location Latest Updates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="mx-auto w-full px-4 sm:px-6 md:px-8 xl:px-[120px] 2xl:px-[296px] mt-10">
          <h2
            className="font-[500] text-[35px] leading-[35px] mb-6"
            style={{ fontFamily: 'Outfit', color: '#1428AE' }}
          >
            {locationDisplayName} Latest Updates
          </h2>

          {/* 4-column news cards */}
          <div className="grid gap-[22px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {cityArticles.slice(0, 12).map(article => (
              <Link
                key={article.id}
                href={buildArticleHref(article.slug, article.city_slug)}
                className="group flex flex-col overflow-hidden rounded-[15px] bg-white transition-shadow hover:shadow-lg"
                style={{ boxShadow: '0px 1px 5px rgba(0,0,0,0.15)' }}
              >
                {/* Image */}
                <div className="relative overflow-hidden rounded-t-[15px] rounded-b-[10px] bg-[#D9D9D9]" style={{ height: 278 }}>
                  <NewsImage article={article} className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
                  {/* Bottom gradient overlay */}
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-b-[10px]"
                    style={{ height: 82, background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000000 100%)' }}
                  />
                  {/* Badge + Date */}
                  <div className="absolute left-4 bottom-4 flex items-center gap-2">
                    <span
                      className="font-[400] text-[12px] leading-[12px] text-white px-3 py-1.5"
                      style={{ background: '#3682E1', borderRadius: 10 }}
                    >
                      {article.category ?? 'News'}
                    </span>
                  </div>
                  <div className="absolute right-3 bottom-[18px]">
                    <span
                      className="font-[300] text-[10px] leading-[10px] text-white text-center"
                      style={{ fontFamily: 'Outfit' }}
                    >
                      {fmtDate(article.published_at)}
                    </span>
                  </div>
                </div>

                {/* Card content */}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <p
                    className="line-clamp-2 font-[500] text-[15px] leading-[20px] group-hover:text-[#1428ae] transition-colors"
                    style={{ fontFamily: 'Outfit', color: '#002143' }}
                  >
                    {article.title}
                  </p>
                  <span
                    className="mt-auto font-[400] text-[12px] leading-[12px] hover:opacity-70"
                    style={{ fontFamily: 'Outfit', color: '#1428AE' }}
                  >
                    READ MORE
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* â”€â”€ Areas Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="mx-auto w-full px-4 sm:px-6 md:px-8 xl:px-[120px] 2xl:px-[296px] mt-10 pb-10">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span
              className="font-[500] text-[18px] leading-[18px] shrink-0"
              style={{ fontFamily: 'Outfit', color: '#1428AE' }}
            >
              Areas:
            </span>
            {[
              'Davao', 'Gensan', 'Cagayan de Oro', 'Butuan', 'Surigao', 'Ozamis',
              'Bohol', 'Dumaguete', 'Bacolod', 'Cebu', 'Iloilo',
              'BGC', 'Cavite', 'Manila', 'Pampanga', 'Taguig', 'Laguna',
            ].map(city => (
              <Link
                key={city}
                href={`/${city.toLowerCase().replace(/\s+/g, '-')}/news`}
                className="font-[300] text-[18px] leading-[18px] hover:text-[#1428ae] transition-colors"
                style={{ fontFamily: 'Outfit', color: '#002143' }}
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        brandName={settings.siteTitle}
      />
    </div>
  )
}
