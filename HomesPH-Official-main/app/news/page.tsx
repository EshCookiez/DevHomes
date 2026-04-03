import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import { SELECTED_LOCATION_COOKIE } from '@/lib/selected-location'
import { getArticles as getArticlesFromAPI } from '@/lib/hybrid-articles'
import AdBanner from '@/components/ui/AdBanner'
import { GENERAL_NAV_ITEMS } from '@/lib/general-nav'
import { buildNewsHref } from '@/lib/news-navigation'
import { RealEstateNewsSection } from '@/components/news/RealEstateNewsSection'
import { OFWNewsSection } from '@/components/news/OFWNewsSection'
import { PhilippineTourismSection } from '@/components/news/PhilippineTourismSection'
import { NewsTicker } from '@/components/news/NewsTicker'

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

const AREA_LINKS = [
  'Davao', 'Gensan', 'Cagayan De Oro', 'Butuan', 'Surigao', 'Ozamis',
  'Bohol', 'Dumaguete', 'Bacolod', 'Cebu', 'Iloilo', 'BGC', 'Cavite', 'Manila',
]
const AREA_LINKS_ROW2 = ['Pampanga', 'Taguig', 'Laguna']

const TICKER_FALLBACKS = [
  'Philippine real estate outlook 2026',
  'Cebu leads regional growth',
  'Mid-market condos rebound',
  'Foreign investors return',
  'Philippine Tourism',
  'OFW Updates Today',
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

function fmtDateFull(value: string) {
  const d = new Date(value)
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  const day = d.getDate()
  const year = d.getFullYear()
  const hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  const m = minutes.toString().padStart(2, '0')
  return `${month} ${day}, ${year} | ${h}:${m} ${ampm}`
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

function StoryImage({ article, className }: { article: Article; className: string }) {
  const image = getImage(article)
  if (!image) {
    return <div className={`${className} bg-gradient-to-br from-slate-800 via-[#1428ae] to-slate-950`} />
  }
  return <img src={image} alt={article.title} className={className} />
}

/* ── Hero Left Column ── */
function LeftColumn({ leadStory, localLatest }: { leadStory?: Article; localLatest: Article[] }) {
  return (
    <div className="w-[295px]">
      {leadStory ? (
        <Link href={`/news/${leadStory.slug}`} className="group block overflow-hidden">
          <div className="relative w-[293px] h-[181px] mx-auto overflow-hidden rounded-[10px] bg-[#D9D9D9]">
            <StoryImage article={leadStory} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
          <p className="mt-[12px] text-left line-clamp-2 text-[18px] font-medium leading-[25px] transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
            {leadStory.title}
          </p>
        </Link>
      ) : null}

      <div className="mt-[13px]">
        {localLatest.slice(0, 5).map((article) => (
          <div key={article.id}>
            <div className="w-[295px] h-[1px] bg-[#D0D0D0] mb-[13px]" />
            <Link href={`/news/${article.slug}`} className="group block mb-[13px]">
              <p className="text-left line-clamp-3 text-[18px] font-light leading-[22px] transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
                {article.title}
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Hero Middle Column ── */
function MiddleColumn({ leadStory, leadRest = [] }: { leadStory?: Article; leadRest?: Article[] }) {
  const textArticle = leadRest[0]
  const secondArticle = leadRest[1]
  const gridArticles = leadRest.slice(2, 5)

  return (
    <div>
      {leadStory ? (
        <Link href={`/news/${leadStory.slug}`} className="group block overflow-hidden">
          <div className="relative w-full h-[328px] overflow-hidden rounded-[15px] bg-[#D9D9D9]">
            <StoryImage article={leadStory} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-x-0 bottom-0 h-[184px] rounded-b-[15px]" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000000 100%)' }} />
            {leadStory.is_live ? (
              <div className="absolute left-[20px] bottom-[20px]">
                <span
                  className="inline-flex items-center gap-[5px] rounded-[20px] h-[35px] px-[20px] text-[15px] font-semibold text-white"
                  style={{ fontFamily: 'Outfit', background: 'linear-gradient(90deg, #1428AE 0%, #004D9D 100%)' }}
                >
                  <span className="inline-block h-[5px] w-[5px] rounded-full bg-white" />
                  LIVE UPDATES
                </span>
              </div>
            ) : null}
          </div>
        </Link>
      ) : null}

      {/* Text headline below hero image */}
      {textArticle ? (
        <Link href={`/news/${textArticle.slug}`} className="group block mt-[15px]">
          <p className="text-left text-[20px] font-medium leading-[28px] transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
            {textArticle.title}
          </p>
        </Link>
      ) : null}

      <div className="w-full h-[1px] bg-[#D0D0D0] mt-[15px] mb-[15px]" />

      {secondArticle ? (
        <Link href={`/news/${secondArticle.slug}`} className="group block mb-[15px]">
          <p className="text-left text-[18px] font-light leading-[18px] transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
            {secondArticle.title}
          </p>
        </Link>
      ) : null}

      {/* 3-image grid row */}
      {gridArticles.length > 0 ? (
        <div>
          <div className="grid gap-[20px] grid-cols-3">
            {gridArticles.map(article => (
              <div key={article.id}>
                <Link href={`/news/${article.slug}`} className="group block">
                  <div className="relative h-[126px] overflow-hidden rounded-[5px] bg-[#D9D9D9]">
                    <StoryImage article={article} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <p className="mt-[6px] text-left line-clamp-2 text-[12px] font-light leading-[15px] transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
                    {article.title}
                  </p>
                </Link>
                <Link href={`/news/${article.slug}`} className="inline-block mt-[6px] text-[12px] font-normal leading-[12px] transition-colors hover:underline" style={{ fontFamily: 'Outfit', color: '#1428AE' }}>
                  READ MORE
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ── Hero Right Column ── */
function RightColumn({ leadRest }: { leadRest: Article[] }) {
  const featured = leadRest[5]
  const catchUpItems = leadRest.slice(6, 9)

  return (
    <div className="w-[295px]">
      {featured ? (
        <Link href={`/news/${featured.slug}`} className="group block overflow-hidden">
          <div className="relative w-[293px] h-[181px] mx-auto overflow-hidden rounded-[10px] bg-[#D9D9D9]">
            <StoryImage article={featured} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
          <p className="mt-[12px] text-left line-clamp-2 text-[18px] font-medium leading-[25px] transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
            {featured.title}
          </p>
        </Link>
      ) : null}

      <div className="w-[295px] h-[1px] bg-[#D0D0D0] mt-[10px] mb-[16px]" />

      <p className="text-left text-[20px] font-medium leading-[20px] mb-[17px]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
        Catch up on today&apos;s news
      </p>

      <div>
        {catchUpItems.map((article, index) => (
          <div key={article.id}>
            <Link href={`/news/${article.slug}`} className="group flex gap-[9px]">
              <div className="h-[79px] w-[128px] shrink-0 overflow-hidden rounded-[5px] bg-[#D9D9D9]">
                <StoryImage article={article} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 w-[152px]">
                <p className="text-left line-clamp-4 text-[15px] font-light leading-[20px] transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
                  {article.title}
                </p>                <p className="mt-[4px] text-[11px] font-light" style={{ fontFamily: 'Outfit', color: '#7D868F' }}>
                  {timeAgo(article.published_at)}
                </p>              </div>
            </Link>
            {index < catchUpItems.length - 1 && (
              <div className="w-[295px] h-[1px] bg-[#D0D0D0] my-[15px]" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── More Top Stories Section ── */
function MoreTopStoriesSection({ articles }: { articles: Article[] }) {
  const featured = articles[0]
  const listArticles = articles.slice(1, 6)

  return (
    <div>
      {featured ? (
        <Link href={`/news/${featured.slug}`} className="group block mb-[15px]">
          <div className="relative h-[181px] overflow-hidden rounded-[15px] bg-[#D9D9D9]">
            <StoryImage article={featured} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
          <p className="mt-[10px] text-left text-[22px] font-medium leading-[25px] line-clamp-2 transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
            {featured.title}
          </p>
        </Link>
      ) : null}

      <div className="space-y-0">
        {listArticles.map((article) => (
          <div key={article.id}>
            <div className="h-[1px] bg-[#D0D0D0] mb-[10px]" />
            <Link href={`/news/${article.slug}`} className="group block mb-[10px]">
              <p className="text-left line-clamp-3 text-[18px] font-light leading-[22px] transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
                {article.title}
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Real Estate & Properties Center Column ── */
function RealEstatePropertiesSection({ articles }: { articles: Article[] }) {
  const featured = articles[0]
  const subArticles = articles.slice(1, 3)

  return (
    <div>
      {featured ? (
        <Link href={`/news/${featured.slug}`} className="group block mb-4">
          <div className="relative h-[401px] overflow-hidden rounded-[15px] bg-[#D9D9D9]">
            <StoryImage article={featured} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-x-0 bottom-0 h-[321px]" style={{ background: 'linear-gradient(180deg, rgba(217,217,217,0) 3.27%, #000000 100%)' }} />
            <div className="absolute left-7 bottom-5">
              <div className="w-[59px] h-[3px] bg-white mb-3" />
              <p className="text-[30px] font-bold leading-[33px] text-white line-clamp-2" style={{ fontFamily: 'Outfit' }}>
                {featured.title}
              </p>
            </div>
          </div>
        </Link>
      ) : null}

      <p className="text-[10px] font-light text-[#7F7F7F] text-right mb-[30px]" style={{ fontFamily: 'Outfit' }}>
        {featured?.author || ''}
      </p>

      {subArticles.map((article) => (
        <div key={article.id} className="mb-[14px]">
          <Link href={`/news/${article.slug}`} className="group flex gap-[10px]">
            <div className="h-[79px] w-[129px] shrink-0 overflow-hidden rounded-[5px] bg-[#D9D9D9]">
              <StoryImage article={article} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-left line-clamp-3 text-[18px] font-light leading-[21px] transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
                {article.title}
              </p>
            </div>
          </Link>
          <div className="mt-[10px] h-[1px] bg-[#D0D0D0]" />
        </div>
      ))}
    </div>
  )
}

/* ── Philippine Latest Sidebar ── */
function PhilippineLatestSidebar({ articles }: { articles: Article[] }) {
  const items = articles.slice(0, 3)

  return (
    <div>
      {items.map((article, index) => (
        <div key={article.id}>
          <Link href={`/news/${article.slug}`} className="group flex gap-[8px]">
            <div className="h-[79px] w-[129px] shrink-0 overflow-hidden rounded-[5px] bg-[#D9D9D9]">
              <StoryImage article={article} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-left line-clamp-3 text-[15px] font-light leading-[18px] transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
                {article.title}
              </p>
            </div>
          </Link>
          {index < items.length - 1 && <div className="mt-[10px] mb-[14px] h-[1px] bg-[#D0D0D0]" />}
        </div>
      ))}
    </div>
  )
}

async function getArticles(location?: string): Promise<Article[]> {
  try {
    console.log('[NewsPage] Fetching articles for location:', location || 'all')
    const result = await getArticlesFromAPI({
      city_slug: location && location !== 'All' ? location : undefined,
      per_page: 100,
      page: 1,
    })

    console.log('[NewsPage] Got', result.data.data.length, 'articles from API')

    return result.data.data.map(article => ({
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
      is_live: true,
      views_count: article.views_count,
    })) as Article[]
  } catch (error) {
    console.error('[NewsPage] Failed to fetch articles:', error)
    throw new Error('Failed to load news articles. Please check that the HomesPhNews API is properly configured with a valid API key.')
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
    focusedLocation ? getArticles(focusedLocation) : Promise.resolve([]),
  ])

  const allArticles = dedupeArticles([...focusedFeed, ...allFeed].map(normalizeArticle)).sort(sortByNewest)
  const matchedFocusedArticles = focusedLocation
    ? dedupeArticles([...focusedFeed.map(normalizeArticle), ...allArticles.filter(article => matchesLocation(article, focusedLocation))]).sort(sortByNewest)
    : []
  const effectiveFocusedLocation = focusedLocation && matchedFocusedArticles.length > 0 ? focusedLocation : undefined
  const leadFeed = effectiveFocusedLocation ? matchedFocusedArticles : allArticles

  const [leadStory, ...leadRest] = leadFeed
  const localLatest = leadRest.slice(0, 5)
  const tickerItems = allArticles.slice(0, 12).map(a => ({ title: a.title, slug: a.slug }))
  const tickerData = tickerItems.length > 0
    ? tickerItems
    : TICKER_FALLBACKS.map(t => ({ title: t, slug: '#' }))

  const topViewed = [...allArticles].sort(sortByViews).slice(0, 8)

  const moreTopStories = allArticles.slice(8, 14)
  const realEstateArticles = allArticles.filter(a => a.category?.toLowerCase().includes('real estate') || a.category?.toLowerCase().includes('market')).slice(0, 5)
  const philippineLatestArticles = allArticles.slice(20, 23)
  const shortsArticles = allArticles.slice(30, 34)
  const latestNewsArticles = allArticles.slice(14, 25)

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Outfit' }}>
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        navItems={GENERAL_NAV_ITEMS}
      />

      {/* ── TICKER BAR ── */}
      <NewsTicker items={tickerData} />

      <main className="w-full bg-white">
        {/* ── HERO 3-COLUMN SECTION ── */}
        <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[120px] 2xl:px-[230px] py-8">
          {allArticles.length === 0 ? (
            <div className="py-28 text-center text-gray-400">
              <p className="text-2xl font-extrabold text-gray-700">No articles found</p>
              <p className="mt-2">Try another location or check back after the next cache refresh.</p>
            </div>
          ) : (
            <>
              <div className="max-w-[1327px] mx-auto w-full">
                <div className="grid gap-6 md:gap-[30px] grid-cols-1 md:grid-cols-[295px_1fr_295px] w-full">
                  <LeftColumn leadStory={leadStory} localLatest={localLatest} />
                  <MiddleColumn leadStory={leadStory} leadRest={leadRest} />
                  <RightColumn leadRest={leadRest} />
                </div>
              </div>

              {/* ── ADS SPACE ── */}
              <div className="mt-10 flex justify-center">
                <div className="w-full max-w-[1051px] h-[195px] rounded-[20px] border border-dashed border-[#1428AE] bg-white flex items-center justify-center">
                  <span className="text-[60px] sm:text-[80px] md:text-[100px] font-thin text-[#1428AE] text-center" style={{ fontFamily: 'Outfit' }}>
                    ADS SPACE
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── CAROUSEL SECTIONS ── */}
        <div className="mt-2 space-y-[43px]">
          <RealEstateNewsSection articles={allArticles} />
          <OFWNewsSection articles={allArticles} />
          <PhilippineTourismSection articles={allArticles} />
        </div>

        {/* ── MOST READ ── */}
        {topViewed.length > 0 && (
          <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[230px] mt-10 mb-6">
            <h2 className="text-[22px] font-medium text-[#1428AE] mb-[18px]" style={{ fontFamily: 'Outfit' }}>Most Read This Week</h2>
            <div className="grid gap-[20px] grid-cols-2 md:grid-cols-4">
              {topViewed.slice(0, 4).map((article, index) => (
                <Link key={article.id} href={`/news/${article.slug}`} className="group flex gap-[10px] items-start">
                  <span className="text-[32px] font-medium leading-none shrink-0" style={{ fontFamily: 'Outfit', color: '#E0E4F8' }}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-light leading-[20px] line-clamp-3 transition-colors group-hover:text-[#1428ae]" style={{ fontFamily: 'Outfit', color: '#002143' }}>
                      {article.title}
                    </p>
                    <p className="mt-[4px] text-[11px] font-light" style={{ fontFamily: 'Outfit', color: '#7D868F' }}>
                      {timeAgo(article.published_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── AREAS SECTION ── */}
        <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[230px] mt-10 mb-6">
          <div className="flex items-baseline flex-wrap">
            <span className="text-[18px] font-medium text-[#1428AE] shrink-0" style={{ fontFamily: 'Outfit' }}>Areas:</span>
            <div className="flex flex-wrap gap-x-[30px] gap-y-2 ml-[16px]">
              {AREA_LINKS.map((area) => (
                <Link
                  key={area}
                  href={buildNewsHref(area)}
                  className="text-[18px] font-light text-[#002143] hover:text-[#1428AE] transition-colors"
                  style={{ fontFamily: 'Outfit' }}
                >
                  {area}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-[30px] gap-y-2 mt-[30px] ml-[69px]">
            {AREA_LINKS_ROW2.map((area) => (
              <Link
                key={area}
                href={buildNewsHref(area)}
                className="text-[18px] font-light text-[#002143] hover:text-[#1428AE] transition-colors"
                style={{ fontFamily: 'Outfit' }}
              >
                {area}
              </Link>
            ))}
          </div>
        </div>

        {/* ── ADS SPACE 2 ── */}
        <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[230px] mb-10">
          <div className="flex justify-center">
            <div className="w-full max-w-[1051px] h-[195px] rounded-[20px] border border-dashed border-[#1428AE] bg-white flex items-center justify-center">
              <span className="text-[100px] font-thin text-[#1428AE] text-center" style={{ fontFamily: 'Outfit', lineHeight: '100px' }}>
                ADS SPACE
              </span>
            </div>
          </div>
        </div>

        {/* ── MORE TOP STORIES + REAL ESTATE & PROPERTIES + PHILIPPINE LATEST ── */}
        {allArticles.length > 8 && (
          <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[230px] mb-10">
            <div className="grid gap-[42px] grid-cols-1 md:grid-cols-[295px_1fr_295px] w-full">
              {/* Left: More Top Stories */}
              <div>
                <p className="text-[15px] font-medium text-[#1428AE] mb-4 uppercase" style={{ fontFamily: 'Outfit' }}>
                  MORE TOP STORIES
                </p>
                <MoreTopStoriesSection articles={moreTopStories.length > 0 ? moreTopStories : allArticles.slice(0, 6)} />
              </div>

              {/* Center: Real Estate & Properties */}
              <div>
                <p className="text-[15px] font-medium text-[#1428AE] mb-4 uppercase" style={{ fontFamily: 'Outfit' }}>
                  REAL ESTATE & PROPERTIES
                </p>
                <RealEstatePropertiesSection articles={realEstateArticles.length >= 3 ? realEstateArticles : allArticles.slice(6, 11)} />
              </div>

              {/* Right: Philippine Latest + Ad */}
              <div>
                <div className="mb-[30px]">
                  <div className="w-full h-[222px] rounded-[15px] border border-dashed border-[#1428AE] flex items-center justify-center">
                    <span className="text-[80px] text-[#1428AE] text-center" style={{ fontFamily: 'Outfit', fontWeight: 200, lineHeight: '80px' }}>
                      ADS
                    </span>
                  </div>
                  <p className="text-[15px] font-light text-[#7F7F7F] text-center mt-[5px]" style={{ fontFamily: 'Outfit' }}>Advertisement</p>
                </div>
                <p className="text-[15px] font-medium text-[#1428AE] mb-4 uppercase" style={{ fontFamily: 'Outfit' }}>
                  PHILIPPINE LATEST
                </p>
                <PhilippineLatestSidebar articles={philippineLatestArticles.length >= 3 ? philippineLatestArticles : allArticles.slice(15, 18)} />
              </div>
            </div>
          </div>
        )}

        {/* ── HOMES.PH SHORTS ── */}
        {allArticles.length > 30 && (
          <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[230px] mb-10">
            <h2 className="text-[40px] font-medium leading-[40px] text-[#1428AE] mb-[20px]" style={{ fontFamily: 'Outfit' }}>
              HOMES.PH Shorts
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[26px]">
              {shortsArticles.map(article => (
                <Link key={article.id} href={`/news/${article.slug}`} className="group block">
                  <div className="relative h-[600px] overflow-hidden rounded-[5px] bg-[#D9D9D9]">
                    <StoryImage article={article} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── LATEST NEWS DARK SECTION ── */}
        {allArticles.length > 14 && (
          <div className="w-full bg-[#002143] pt-[66px] pb-[98px]">
            <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-[230px]">
              <h2 className="text-[40px] font-medium leading-[40px] text-white mb-[20px]" style={{ fontFamily: 'Outfit' }}>
                Latest News
              </h2>

              <div className="grid gap-[35px] grid-cols-1 lg:grid-cols-[1fr_445px]">
                {/* Left: Large featured image */}
                {latestNewsArticles[0] ? (
                  <div>
                    <Link href={`/news/${latestNewsArticles[0].slug}`} className="group block">
                      <div className="relative h-[559px] overflow-hidden rounded-[15px] bg-[#D9D9D9]">
                        <StoryImage article={latestNewsArticles[0]} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 h-[282px]" style={{ background: 'linear-gradient(180deg, rgba(217,217,217,0) 21.4%, #000000 100%)' }} />
                        <div className="absolute left-[33px] bottom-[33px] right-5">
                          <div className="w-[59px] h-[3px] bg-white mb-3" />
                          <p className="text-[32px] font-bold leading-[35px] text-white line-clamp-2" style={{ fontFamily: 'Outfit' }}>
                            {latestNewsArticles[0].title}
                          </p>
                        </div>
                      </div>
                    </Link>
                    {latestNewsArticles[0].author && (
                      <p className="mt-[9px] text-[10px] font-light text-[#D2D2D2]" style={{ fontFamily: 'Outfit' }}>
                        {latestNewsArticles[0].author}
                      </p>
                    )}
                  </div>
                ) : null}

                {/* Right: List of article titles */}
                <div className="space-y-0">
                  {latestNewsArticles.slice(1, 11).map((article, index) => (
                    <div key={article.id}>
                      <Link href={`/news/${article.slug}`} className="group block">
                        <p className="text-[18px] font-light leading-[22px] text-white transition-colors group-hover:text-blue-300 line-clamp-2" style={{ fontFamily: 'Outfit' }}>
                          {article.title}
                        </p>
                        <p className="mt-[4px] text-[11px] font-light" style={{ fontFamily: 'Outfit', color: '#7D868F' }}>
                          {timeAgo(article.published_at)}
                        </p>
                      </Link>
                      {index < 9 && <div className="h-[1px] bg-[#37507A] my-[15px]" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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
