/**
 * Reference Implementation: Article Detail Component
 * 
 * This is an example of how to build an article detail page using the external API
 * with content block rendering, related articles, and all the features.
 * 
 * Copy this as a starting point for your own implementation.
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Share2, Printer, Copy, X } from 'lucide-react'
import { ExternalArticle, renderContentBlocks } from '@/lib/external-api'

interface ArticleDetailProps {
  article: ExternalArticle
  relatedArticles?: ExternalArticle[]
}

/**
 * Main article detail component
 * Shows hero image, content blocks, metadata, and related articles
 */
export function ArticleDetailComponent({
  article,
  relatedArticles = [],
}: ArticleDetailProps) {
  const htmlContent = article.content_blocks
    ? renderContentBlocks(article.content_blocks)
    : null

  return (
    <article className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="border-l-4 border-[#1428ae] pl-6 mb-8">
        <h1 className="text-4xl font-extrabold leading-tight text-gray-950 mb-3">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
          {article.author && (
            <div className="flex items-center gap-2">
              <span>By</span>
              <span className="font-semibold text-gray-700">{article.author}</span>
            </div>
          )}

          {article.published_at && (
            <time className="font-semibold text-gray-700">
              {new Date(article.published_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          )}

          {article.views_count !== undefined && (
            <span className="text-gray-500">{article.views_count.toLocaleString()} views</span>
          )}
        </div>

        {/* Social Buttons */}
        <div className="flex items-center gap-3">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => shareArticle('share', article)}
            title="Share"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => window.print()}
            title="Print"
          >
            <Printer className="w-5 h-5 text-gray-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => copyToClipboard(window.location.href)}
            title="Copy link"
          >
            <Copy className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main Column */}
        <div className="space-y-8">
          {/* Featured Image */}
          {article.image && (
            <div className="space-y-3">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Tag Placeholder */}
              <p className="text-sm font-medium text-gray-500" style={{ fontFamily: 'Outfit' }}>
                Tag
              </p>
            </div>
          )}

          {/* Category & Topics */}
          {(article.category || article.topics) && (
            <div className="flex flex-wrap gap-2">
              {article.category && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {article.category}
                </span>
              )}
              {article.topics?.map((topic, idx) => (
                <span
                  key={idx}
                  className="inline-block px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Article Summary */}
          {article.summary && (
            <p className="text-lg text-gray-600 leading-relaxed italic border-l-4 border-gray-300 pl-4">
              {article.summary}
            </p>
          )}

          {/* Content Blocks (Primary Content) */}
          {htmlContent ? (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: htmlContent,
              }}
            />
          ) : article.description ? (
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed">{article.description}</p>
            </div>
          ) : null}

          {/* Article Footer */}
          <div className="border-t border-gray-200 pt-6 flex items-center justify-between">
            <div>
              {article.author && (
                <p className="text-gray-700 font-semibold">{article.author}</p>
              )}
              {article.published_at && (
                <p className="text-gray-500 text-sm">
                  {new Date(article.published_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ad Banner Placeholder */}
          <div className="rounded-lg bg-gray-200 h-80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-gray-600">ADS</p>
              <p className="text-sm text-gray-500 mt-2">Advertisement</p>
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-700 mb-4">
                Related Articles
              </h3>
              <div className="space-y-4">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/news/${related.slug}`}
                    className="group block hover:text-[#1428ae] transition-colors"
                  >
                    <div className="flex gap-3">
                      {related.image && (
                        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                          <img
                            src={related.image}
                            alt={related.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-bold text-gray-950 group-hover:text-[#1428ae] transition-colors">
                          {related.title}
                        </p>
                        {related.published_at && (
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(related.published_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
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
    </article>
  )
}

/**
 * Grid layout for article cards in lists
 */
export function ArticleCardGrid({
  articles,
  columns = 3,
}: {
  articles: ExternalArticle[]
  columns?: number
}) {
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${100 / columns}%, 1fr))`,
      }}
    >
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}

/**
 * Single article card for lists
 */
export function ArticleCard({ article }: { article: ExternalArticle }) {
  return (
    <Link href={`/news/${article.slug}`} className="group">
      <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Image */}
        {article.image && (
          <div className="relative h-48 overflow-hidden bg-gray-200">
            <img
              src={article.image}
              alt={article.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {article.category && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold uppercase">
                {article.category}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-base font-bold text-gray-950 group-hover:text-[#1428ae] transition-colors mb-2">
            {article.title}
          </h3>

          {article.summary && (
            <p className="line-clamp-2 text-sm text-gray-600 mb-auto">
              {article.summary}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            {article.published_at && (
              <time>
                {new Date(article.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            )}
            {article.views_count !== undefined && (
              <span>{article.views_count.toLocaleString()} views</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

/**
 * Compact article preview for sidebars
 */
export function ArticlePreview({ article }: { article: ExternalArticle }) {
  return (
    <Link href={`/news/${article.slug}`} className="group block">
      <div className="flex gap-3 p-2 hover:bg-gray-50 rounded transition-colors">
        {article.image && (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-gray-200">
            <img
              src={article.image}
              alt=""
              className="h-full w-full object-cover group-hover:scale-110 transition-transform"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-bold text-gray-900 group-hover:text-[#1428ae]">
            {article.title}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ─── Utility Functions ─────────────────────────────────────────────────────

/**
 * Share article using Web Share API or fallback
 */
function shareArticle(method: string, article: ExternalArticle) {
  const text = `${article.title} - HomesPH News`
  const url = typeof window !== 'undefined' ? window.location.href : ''

  if (navigator.share) {
    navigator.share({
      title: article.title,
      text: article.summary,
      url,
    }).catch(() => {}) // Silently ignore cancel
  } else {
    // Fallback: copy to clipboard
    copyToClipboard(url)
  }
}

/**
 * Copy text to clipboard with visual feedback
 */
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    // Show success message (could use toast library)
    alert('Link copied to clipboard!')
  })
}

export default ArticleDetailComponent
