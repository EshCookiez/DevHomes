import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import { GENERAL_NAV_ITEMS } from '@/lib/general-nav'
import { getArticleBySlug, getArticles } from '@/lib/hybrid-articles'
import { renderContentBlocks } from '@/lib/external-api'
import type { ExternalArticle } from '@/lib/external-api'
import { ArticleHeader } from '@/components/news/ArticleHeader'
import AdBanner from '@/components/ui/AdBanner'

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

function getImage(article: ExternalArticle) {
  return article.image ?? ''
}

export default async function ArticleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ location?: string }>
}) {
  const { slug } = await params
  const { location } = await searchParams
  const settings = await getSiteSettings()
  
  let article: ExternalArticle | null = null
  let relatedArticles: ExternalArticle[] = []
  let latestStories: ExternalArticle[] = []
  let trendingStories: ExternalArticle[] = []

  try {
    // Fetch the article from the real API
    article = await getArticleBySlug(slug)
    
    if (!article) {
      return (
        <div className="min-h-screen bg-gray-50">
          <SiteHeader
            logoUrl={settings.logoUrl}
            contactEmail={settings.contactEmail}
            contactPhone={settings.contactPhone}
            socialLinks={settings.socialLinks}
            navItems={GENERAL_NAV_ITEMS}
          />
          <main className="mx-auto max-w-7xl px-4 py-20 text-center">
            <h1 className="text-4xl font-extrabold text-gray-950">Article not found</h1>
            <p className="mt-4 text-gray-600">The article you're looking for doesn't exist.</p>
            <Link href="/news" className="mt-6 inline-block text-[#1428ae] font-bold hover:underline">
              ← Back to News
            </Link>
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

    // Fetch related articles: same category, excluding current article
    if (article) {
      const currentArticle = article
      try {
        const relatedResult = await getArticles({
          category_slug: currentArticle.category_slug,
          per_page: 20,
          page: 1,
        })
        relatedArticles = relatedResult.data.data
          .filter(a => a.id !== currentArticle.id)
          .slice(0, 8)
        latestStories = relatedArticles.slice(0, 4)
        trendingStories = relatedArticles.slice(4, 8)
      } catch (err) {
        console.error('[ArticleDetail] Failed to fetch related articles:', err)
        // Continue without related articles
        relatedArticles = []
      }
    }
  } catch (error) {
    console.error('[ArticleDetail] Failed to fetch article:', error)
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader
          logoUrl={settings.logoUrl}
          contactEmail={settings.contactEmail}
          contactPhone={settings.contactPhone}
          socialLinks={settings.socialLinks}
          navItems={GENERAL_NAV_ITEMS}
        />
        <main className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-4xl font-extrabold text-gray-950">Article not found</h1>
          <p className="mt-4 text-gray-600">The article you're looking for doesn't exist.</p>
          <Link href="/news" className="mt-6 inline-block text-[#1428ae] font-bold hover:underline">
            ← Back to News
          </Link>
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


  // Render content blocks from API
  const htmlContent = article.content_blocks ? renderContentBlocks(article.content_blocks) : null
  const image = getImage(article)

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        navItems={GENERAL_NAV_ITEMS}
      />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header Section */}
        <ArticleHeader 
          title={article.title}
          updatedTime={timeAgo(article.published_at)}
          author={article.author ?? 'HomesPH News Desk'}
          viewsCount={article.views_count}
        />

        {/* Two Column Layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Featured Image */}
            {image && (
              <div>
                {article.category && (
                  <p className="mt-3 text-sm font-medium text-[#1428ae]" style={{ fontFamily: 'Outfit' }}>
                    {article.category}
                  </p>
                )}
              </div>
            )}

            {/* Article Content - Render from content_blocks */}
            <div className="prose prose-lg max-w-none">
              {htmlContent ? (
                <div
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                  className="article-content space-y-4"
                  style={{
                    color: '#333',
                    lineHeight: '1.6',
                  }}
                />
              ) : (
                // Fallback to description/summary if no content blocks
                <>
                  {article.summary && (
                    <p className="text-gray-700 leading-relaxed mb-4 text-lg font-semibold">
                      {article.summary}
                    </p>
                  )}
                  {article.description && (
                    <p className="text-gray-700 leading-relaxed">
                      {article.description}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Article Footer */}
            <div className="border-t border-gray-200 pt-6 flex items-center justify-between">
              <div>
                <p className="text-gray-700 font-semibold">{article.author ?? 'HomesPH News Desk'}</p>
                <p className="text-gray-500 text-sm">{fmtDate(article.published_at)}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ad Banner */}
            <div className="rounded-lg bg-gray-200 h-80 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-gray-600">ADS</p>
                <p className="text-sm text-gray-500 mt-2">Advertisement</p>
              </div>
            </div>

            {/* Latest Stories */}
            {latestStories.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-700 mb-4">Latest Stories</h3>
                <div className="space-y-4">
                  {latestStories.map(story => (
                    <Link key={story.id} href={`/news/${story.slug}`} className="group block">
                      <div className="flex gap-3">
                        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                          {getImage(story) && (
                            <img
                              src={getImage(story)}
                              alt={story.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-bold text-gray-950 group-hover:text-[#1428ae] transition-colors">
                            {story.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">{fmtDate(story.published_at)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            {trendingStories.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-700 mb-4">Trending</h3>
                <div className="space-y-4">
                  {trendingStories.map(story => (
                    <Link key={story.id} href={`/news/${story.slug}`} className="group block">
                      <div className="flex gap-3">
                        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                          {getImage(story) && (
                            <img
                              src={getImage(story)}
                              alt={story.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-bold text-gray-950 group-hover:text-[#1428ae] transition-colors">
                            {story.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">{fmtDate(story.published_at)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Ad Banner Bottom */}
            <div className="rounded-lg bg-gray-200 h-80 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-gray-600">ADS</p>
                <p className="text-sm text-gray-500 mt-2">Advertisement</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="mt-16">
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
