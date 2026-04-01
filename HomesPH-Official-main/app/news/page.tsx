import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import { SELECTED_LOCATION_COOKIE } from '@/lib/selected-location'
import { MOCK_NEWS } from '@/lib/mock-data'
import AdBanner from '@/components/ui/AdBanner'
import { GENERAL_NAV_ITEMS } from '@/lib/general-nav'
import { buildNewsHref } from '@/lib/news-navigation'
import { RealEstateNewsSection } from '@/components/news/RealEstateNewsSection'
import { OFWNewsSection } from '@/components/news/OFWNewsSection'
import { PhilippineTourismSection } from '@/components/news/PhilippineTourismSection'

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
  const values = [article.location, article.city, ...(article.tags ?? []), ...(article.topics ?? [])]
  return values.some(value => {
    const normalized = normalizeValue(value)
    return normalized ? normalized.includes(normalizedLocation) || normalizedLocation.includes(normalized) : false
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

function StoryImage({ article, className }: { article: Article; className: string }) {
  const image = getImage(article)
  if (!image) {
    return <div className={`${className} bg-gradient-to-br from-slate-800 via-[#1428ae] to-slate-950`} />
  }

  return <img src={image} alt={article.title} className={className} />
}

function MetaRow({ article, emphasizeLocation = false }: { article: Article; emphasizeLocation?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
      {article.location && (
        <span className={emphasizeLocation ? 'rounded-full bg-blue-50 px-2.5 py-1 font-black uppercase tracking-wider text-[#1428ae]' : 'font-semibold text-gray-500'}>
          {article.location}
        </span>
      )}
      <span>{timeAgo(article.published_at)}</span>
      {article.read_time ? <span>{article.read_time} min read</span> : null}
      {(article.views_count ?? 0) > 0 ? <span>{(article.views_count ?? 0).toLocaleString()} views</span> : null}
    </div>
  )
}

function CompactStory({ article }: { article: Article }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex gap-4 rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_45px_-24px_rgba(15,23,42,0.28)]"
    >
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-[18px] bg-slate-100 ring-1 ring-black/5">
        <StoryImage article={article} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" />
      </div>
      <div className="min-w-0 flex-1">
        {article.category ? (
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{article.category}</p>
        ) : null}
        <p className="line-clamp-2 text-[15px] font-extrabold leading-snug text-slate-950 transition-colors group-hover:text-[#1428ae]">
          {article.title}
        </p>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{getExcerpt(article)}</p>
        <div className="mt-3">
          <MetaRow article={article} emphasizeLocation />
        </div>
      </div>
    </Link>
  )
}

function ProfessionalStoryCard({ article, compact = false }: { article: Article; compact?: boolean }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group news-card-anim overflow-hidden rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_22px_55px_-26px_rgba(15,23,42,0.28)]"
    >
      <div className={compact ? 'relative h-44 overflow-hidden bg-slate-100' : 'relative h-56 overflow-hidden bg-slate-100'}>
        <StoryImage article={article} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {article.category ? (
            <span className="rounded-full bg-white/88 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-900 backdrop-blur-sm">
              {article.category}
            </span>
          ) : null}
          {article.is_live ? (
            <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white">Live</span>
          ) : null}
        </div>
      </div>
      <div className="p-5">
        <MetaRow article={article} emphasizeLocation />
        <p className={compact ? 'mt-3 line-clamp-2 text-lg font-extrabold leading-tight text-slate-950 transition-colors group-hover:text-[#1428ae]' : 'mt-3 line-clamp-2 text-[22px] font-extrabold leading-tight text-slate-950 transition-colors group-hover:text-[#1428ae]'}>
          {article.title}
        </p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">{getExcerpt(article)}</p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-4 text-xs text-slate-500">
          <span className="truncate font-semibold text-slate-700">{article.author ?? 'HomesPH News Desk'}</span>
          {article.read_time ? <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-500">{article.read_time} min</span> : null}
        </div>
      </div>
    </Link>
  )
}

function LeftColumn({ leadStory, localLatest }: { leadStory?: Article; localLatest: Article[] }) {
  return (
    <div className="space-y-0">
      {leadStory ? (
        <Link
          href={`/news/${leadStory.slug}`}
          className="group block overflow-hidden mb-6"
        >
          <div className="relative h-[185px] overflow-hidden rounded-[20px]">
            <StoryImage article={leadStory} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="bg-gray-50 px-0 py-3">
            <p className="text-left line-clamp-2 text-sm font-bold transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
              {leadStory.title}
            </p>
          </div>
        </Link>
      ) : null}

      <div className="space-y-4">
        {localLatest.slice(0, 5).map((article, index) => (
          <div key={article.id}>
            <Link href={`/news/${article.slug}`} className="group block">
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

function MiddleColumn({ leadStory, leadRest = [] }: { leadStory?: Article; leadRest?: Article[] }) {
  const textArticle = leadRest[0]
  const gridArticles = leadRest.slice(1, 4)

  return (
    <div className="space-y-0">
      {leadStory ? (
        <Link href={`/news/${leadStory.slug}`} className="group block overflow-hidden">
          <div className="relative h-[330px] overflow-hidden rounded-[20px]">
            <StoryImage article={leadStory} className="h-full w-full object-cover opacity-95 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute left-4 top-4">
              {leadStory.is_live ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white">
                  <span className="inline-block h-2 w-2 rounded-full bg-white"></span>
                  Live Updates
                </span>
              ) : null}
            </div>
          </div>
          <div className="bg-gray-50 pt-[20px] px-0 pb-6">
            <h2 className="text-left text-xl font-extrabold leading-tight" style={{ fontFamily: 'Outfit', color: '#002143' }}>
              {leadStory.title}
            </h2>
          </div>
        </Link>
      ) : null}

      <div className="mt-[15px] mb-3"></div>

      {textArticle ? (
        <Link href={`/news/${textArticle.slug}`} className="group block">
          <h3 className="text-left text-lg font-extrabold leading-tight transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
            {textArticle.title}
          </h3>
        </Link>
      ) : null}

      {gridArticles.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-3">
            {gridArticles.map(article => (
              <div key={article.id} className="space-y-2">
                <Link href={`/news/${article.slug}`} className="group block">
                  <div className="relative h-24 overflow-hidden rounded-[8px]">
                    <StoryImage article={article} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <p className="text-left line-clamp-2 text-xs font-bold transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
                    {article.title}
                  </p>
                </Link>
                <Link href={`/news/${article.slug}`} className="inline-block text-xs font-bold transition-colors hover:text-[#0c1f4a]" style={{ color: '#1428AE' }}>
                  READ MORE
                </Link>
              </div>
            ))}
          </div>
          <Link href="#" className="inline-block text-sm font-bold transition-colors hover:text-[#0c1f4a]" style={{ color: '#1428AE' }}>
            READ MORE
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function RightColumn({ leadRest }: { leadRest: Article[] }) {
  const featured = leadRest[3]
  const catchUpItems = leadRest.slice(4, 8)

  return (
    <div className="space-y-0">
      {featured ? (
        <Link
          href={`/news/${featured.slug}`}
          className="group block overflow-hidden mb-6"
        >
          <div className="relative h-[185px] overflow-hidden rounded-[20px]">
            <StoryImage article={featured} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="bg-gray-50 px-0 py-3">
            <p className="text-left line-clamp-2 text-sm font-bold transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
              {featured.title}
            </p>
          </div>
        </Link>
      ) : null}

      <div>
        <p className="text-left text-sm font-bold mb-4" style={{ fontFamily: 'Outfit', color: '#002143' }}>Catch up on today's news</p>
        <div className="space-y-0">
          {catchUpItems.map((article, index) => (
            <div key={article.id}>
              <Link href={`/news/${article.slug}`} className="group flex gap-3">
                <div className="h-14 w-16 shrink-0 overflow-hidden rounded-[8px] bg-gray-200">
                  <StoryImage article={article} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-left line-clamp-2 text-xs font-bold transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
                    {article.title}
                  </p>
                  <p className="mt-0.5 text-xs line-clamp-1 text-left" style={{ fontFamily: 'Outfit', color: '#666666' }}>{getExcerpt(article).substring(0, 40)}...</p>
                </div>
              </Link>
              {index < 3 && <div className="my-[7.5px] border-b border-gray-300"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

async function fetchArticleCollection(location?: string, page = 1, limit = 40): Promise<ArticleCollection> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const url = new URL('/api/articles', baseUrl)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))
  if (location && location !== 'All') url.searchParams.set('location', location)

  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (!res.ok) throw new Error('API error')

  const data = await res.json()
  return extractArticleCollection(data)
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
      articles: MOCK_NEWS as Article[],
      total: (MOCK_NEWS as Article[]).length,
      currentPage: 1,
      lastPage: 1,
      perPage: (MOCK_NEWS as Article[]).length,
    }
  }
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>
}) {
  const { location: queryLocation } = await searchParams
  if (queryLocation && queryLocation !== 'All') {
    redirect(buildNewsHref(queryLocation))
  }
  const cookieStore = await cookies()
  const cookieLocation = cookieStore.get(SELECTED_LOCATION_COOKIE)?.value
  const manualLocation = queryLocation && queryLocation !== 'All' ? decodeURIComponent(queryLocation) : undefined
  const savedLocation = cookieLocation ? decodeURIComponent(cookieLocation) : undefined
  const focusedLocation = manualLocation ?? savedLocation

  const [settings, allFeed, focusedFeed] = await Promise.all([
    getSiteSettings(),
    getArticles(),
    focusedLocation ? getArticles(focusedLocation) : Promise.resolve({ articles: [], total: 0, currentPage: 1, lastPage: 1, perPage: 0 }),
  ])

  const allArticles = dedupeArticles([...focusedFeed.articles, ...allFeed.articles, ...(MOCK_NEWS as Article[])].map(normalizeArticle)).sort(sortByNewest)
  const matchedFocusedArticles = focusedLocation
    ? dedupeArticles([...focusedFeed.articles.map(normalizeArticle), ...allArticles.filter(article => matchesLocation(article, focusedLocation))]).sort(sortByNewest)
    : []
  const effectiveFocusedLocation = focusedLocation && matchedFocusedArticles.length > 0 ? focusedLocation : undefined
  const leadFeed = effectiveFocusedLocation ? matchedFocusedArticles : allArticles

  const [leadStory, ...leadRest] = leadFeed
  const localLatest = leadRest.slice(0, 5)
  const tickerTitles = allArticles.slice(0, 12).map(article => article.title)
  const tickerDuped = [...tickerTitles, ...tickerTitles]

  const categoryGroups = groupArticles(allArticles, article => article.category)
    .sort((a, b) => b.items.length - a.items.length || a.key.localeCompare(b.key))
    .slice(0, 6)

  const provinceGroups = groupArticles(allArticles, article => article.location ?? article.city)
    .filter(group => group.key !== effectiveFocusedLocation)
    .sort((a, b) => b.items.length - a.items.length || a.key.localeCompare(b.key))
    .slice(0, 8)

  const topViewed = [...allArticles].sort(sortByViews).slice(0, 8)
  const quickReads = allArticles.filter(article => (article.read_time ?? 99) <= 5).slice(0, 8)
  const deepReads = allArticles.filter(article => (article.read_time ?? 0) >= 6 || article.category === 'Guides').slice(0, 6)
  const heroViews = leadFeed[0]?.views_count && leadFeed[0].views_count > 0
    ? leadFeed[0].views_count
    : (topViewed[0]?.views_count ?? 0)

  const topicGroups = groupArticles(allArticles, article => article.topics?.[0])
    .sort((a, b) => b.items.length - a.items.length || a.key.localeCompare(b.key))
    .slice(0, 6)

  const authorGroups = groupArticles(allArticles, article => article.author)
    .sort((a, b) => b.items.length - a.items.length || a.key.localeCompare(b.key))
    .slice(0, 6)

  const reservedIds = new Set<string>([
    ...leadFeed.slice(0, 6).map(article => String(article.id)),
    ...topViewed.slice(0, 8).map(article => String(article.id)),
    ...quickReads.slice(0, 8).map(article => String(article.id)),
  ])
  const moreStories = allArticles.filter(article => !reservedIds.has(String(article.id))).slice(0, 48)

  

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        navItems={GENERAL_NAV_ITEMS}
      />

      <div className="overflow-hidden border-b border-gray-200 bg-white py-3 text-sm text-gray-900 shadow-sm">
        <div className="flex items-stretch">
          <span className="flex shrink-0 items-center bg-gradient-to-r from-blue-600 to-blue-700 px-5 text-[11px] font-black uppercase tracking-widest text-white">
            Latest
          </span>
          <div className="ticker-track flex-1">
            {tickerDuped.map((title, index) => (
              <span key={`${title}-${index}`} className="inline-block shrink-0 px-6 text-sm font-medium text-gray-700 hover:text-blue-600">
                <span className="mr-2 font-bold text-blue-600">•</span>
                {title}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="w-full">
        <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[120px] 2xl:px-[230px] py-8">
        {allArticles.length === 0 ? (
          <div className="py-28 text-center text-gray-400">
            <p className="text-2xl font-extrabold text-gray-700">No articles found</p>
            <p className="mt-2">Try another location or check back after the next cache refresh.</p>
          </div>
        ) : (
          <>
            {/* MAIN 3-COLUMN GRID */}
            <div className="flex justify-center w-full overflow-x-auto">
              <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-[295px_620px_295px] lg:grid-cols-[295px_620px_295px] min-w-full md:min-w-max">
              <LeftColumn leadStory={leadStory} localLatest={localLatest} />
              <MiddleColumn leadStory={leadStory} leadRest={leadRest} />
              <RightColumn leadRest={leadRest} />
              </div>
            </div>

            <div className="mt-8">
              <AdBanner />
            </div>
          </>
        )}
        </div>

        {/* Carousel Sections using new components */}
        <div className="mt-6 space-y-[40px]">
          <RealEstateNewsSection articles={allArticles} />
          <OFWNewsSection articles={allArticles} />
          <PhilippineTourismSection />
        </div>

        {/* Continue with more content inside main padding */}
        <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[120px] 2xl:px-[230px]">
          {allArticles.length > 0 && (
            <>
            {/* MORE NEWS GRID */}
            <section className="mt-12">
              <h3 className="mb-6 text-2xl font-extrabold text-gray-950">More News</h3>
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Featured + List */}
                <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm shadow-gray-200/50">
                  {allArticles[6] ? (
                    <div className="mb-4">
                      <ProfessionalStoryCard article={allArticles[6]} compact />
                    </div>
                  ) : null}
                  <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                    {allArticles.slice(7, 11).map(article => (
                      <Link key={article.id} href={`/news/${article.slug}`} className="group block text-sm font-semibold text-gray-950 transition-colors hover:text-[#1428ae] line-clamp-2">
                        {article.title}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Center: Large + 2 Small */}
                <div className="space-y-4">
                  {allArticles[11] ? (
                    <Link href={`/news/${allArticles[11].slug}`} className="group block overflow-hidden rounded-[20px] bg-gray-100">
                      <div className="relative aspect-[3/2] overflow-hidden">
                        <StoryImage article={allArticles[11]} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <p className="line-clamp-2 font-bold text-white">{allArticles[11].title}</p>
                        </div>
                      </div>
                    </Link>
                  ) : null}
                  <div className="grid gap-3 grid-cols-2">
                    {allArticles.slice(12, 14).map(article => (
                      <Link key={article.id} href={`/news/${article.slug}`} className="group block overflow-hidden rounded-[14px] bg-gray-100">
                        <div className="relative aspect-video overflow-hidden">
                          <StoryImage article={article} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Right: Thumbnails + Titles */}
                <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm shadow-gray-200/50">
                  <div className="space-y-3">
                    {allArticles.slice(14, 18).map(article => (
                      <Link key={article.id} href={`/news/${article.slug}`} className="group flex gap-3 rounded-[12px] border border-gray-100 p-2 transition-all duration-200 hover:shadow-md hover:shadow-gray-200/50">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-gray-200">
                          <StoryImage article={article} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-bold text-gray-950 transition-colors group-hover:text-[#1428ae]">
                            {article.title}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* EXTRA NEWS: CATEGORY COLUMNS */}
            {categoryGroups.length > 0 ? (
              <section className="mt-12">
                <h3 className="mb-6 text-2xl font-extrabold text-gray-950">Extra News</h3>
                <div className="grid gap-6 lg:grid-cols-3">
                  {categoryGroups.slice(0, 3).map(group => (
                    <div key={group.key} className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm shadow-gray-200/50">
                      <p className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#1428ae]">{group.key}</p>
                      <div className="space-y-3">
                        {group.items.slice(0, 4).map(article => (
                          <Link key={article.id} href={`/news/${article.slug}`} className="group block">
                            <p className="line-clamp-2 text-sm font-bold text-gray-950 transition-colors group-hover:text-[#1428ae]">
                              {article.title}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-500">{timeAgo(article.published_at)}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* LATEST NEWS: DARK SECTION */}
            <section className="mt-12 overflow-hidden rounded-[28px] bg-gray-950 p-8 text-white">
              <h3 className="text-2xl font-extrabold">Latest News</h3>
              <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
                {/* Left: Large featured */}
                {allArticles[18] ? (
                  <Link href={`/news/${allArticles[18].slug}`} className="group block overflow-hidden rounded-[20px]">
                    <div className="relative aspect-[16/9]">
                      <StoryImage article={allArticles[18]} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">{allArticles[18].category}</p>
                        <p className="mt-2 line-clamp-2 text-xl font-extrabold text-white">{allArticles[18].title}</p>
                      </div>
                    </div>
                  </Link>
                ) : null}

                {/* Right: List */}
                <div className="space-y-3">
                  {allArticles.slice(19, 24).map(article => (
                    <Link key={article.id} href={`/news/${article.slug}`} className="group block border-l-2 border-amber-400 pl-4 py-2 transition-all duration-200">
                      <p className="line-clamp-2 text-sm font-bold text-white transition-colors group-hover:text-amber-400">
                        {article.title}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">{timeAgo(article.published_at)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* SHARE SECTION */}
            <section className="mt-12 rounded-[28px] bg-gradient-to-r from-slate-100 to-blue-50 p-8 text-center">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#1428ae]">Share & Follow</p>
              <h3 className="mt-3 text-2xl font-extrabold text-gray-950">Stay in the loop</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
                Get the latest real estate news, market insights, and property updates delivered to your inbox.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button className="rounded-full bg-[#1428ae] px-6 py-2 text-sm font-bold text-white transition-transform hover:scale-105">
                  Share This Page
                </button>
                <button className="rounded-full border-2 border-[#1428ae] px-6 py-2 text-sm font-bold text-[#1428ae] transition-all hover:bg-[#1428ae] hover:text-white">
                  Subscribe
                </button>
              </div>
            </section>
          </>
        )}
        </div>
      </main>

      <div className="mt-10">
        <AdBanner />
      </div>

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
