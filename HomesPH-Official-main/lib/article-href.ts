/**
 * Build the canonical href for a news article.
 * If a city slug is available, returns /{citySlug}/news/{slug}.
 * Otherwise falls back to /news/{slug}.
 */
export function buildArticleHref(slug: string, citySlug?: string | null): string {
  if (citySlug) return `/${citySlug}/news/${slug}`
  return `/news/${slug}`
}
