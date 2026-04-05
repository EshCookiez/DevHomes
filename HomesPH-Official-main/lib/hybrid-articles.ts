/**
 * News Fetcher via Secure Backend Proxy
 * 
 * Fetchesdata from external HomesPhNews API through a secure backend proxy.
 * The API key stays on the backend and is never exposed to the browser.
 * 
 * Architecture:
 * Frontend → /api/v1/news/articles (Your Backend Proxy)
 *         → Adds X-Site-Key header (kept secret!)
 *         → External HomesPhNews API
 * 
 * This prevents API key exposure in browser Network tabs.
 */

import type { PaginatedResponse, ExternalArticle } from './external-api'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ArticleListParams {
  search?: string
  q?: string
  category_slug?: string
  category?: string
  country_slug?: string
  country?: string
  province_slug?: string
  province?: string | number
  city_slug?: string
  city?: string | number
  topic?: string
  per_page?: number
  limit?: number
  page?: number
}

// ─── Proxy API Client ──────────────────────────────────────────────────────

/**
 * Fetch from backend proxy instead of external API directly
 * This keeps the API key secure on the backend
 */
async function fetchNewsFromProxy<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let baseUrl = ''

  // Only use full URL on server-side (typeof window === 'undefined')
  if (typeof window === 'undefined') {
    // During server-side rendering, we can bypass our own proxy route
    // and talk directly to the external API, avoiding "localhost" or VERCEL_URL issues!
    const API_BASEURL = process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'https://homesphnews-api-394504332858.asia-southeast1.run.app/api'
    const API_KEY = process.env.HOMESPH_NEWS_API_KEY || ''
    
    // endpoint here looks like "/articles?city_slug=cebu&per_page=40"
    const externalUrl = `${API_BASEURL}/external${endpoint}`
    
    try {
      const response = await fetch(externalUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Site-Key': API_KEY,
          'Accept': 'application/json',
          ...options.headers,
        },
        cache: 'no-store' // Avoid stale build-time data missing API keys
      })

      if (!response.ok) {
        throw new Error(`Direct News API Error: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.warn(`[News SSR] Failed direct fetch to ${externalUrl}:`, error)
      throw error
    }
  }

  // Client-side: use relative URL to our proxy route
  const url = `/api/v1/news${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`[News Proxy] ${response.status} ${endpoint}`)
      if (response.status === 404) {
        console.warn('[News Proxy] Endpoint not found. Verify proxy route exists and API is configured.')
      }
      throw new Error(`News API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn(`[News Proxy] Failed to fetch ${endpoint}:`, error)
    throw error
  }
}

// ─── API-Only Data Fetching ────────────────────────────────────────────────

/**
 * Fetch articles from external API (no fallback)
 */
export async function getArticles(
  params: ArticleListParams & { useMockData?: boolean } = {}
): Promise<PaginatedResponse<ExternalArticle>> {
  const { useMockData = false, ...apiParams } = params

  // Note: useMockData parameter kept for backwards compatibility but not used
  const queryString = new URLSearchParams()

  if (apiParams.search) queryString.append('search', apiParams.search)
  if (apiParams.q) queryString.append('q', apiParams.q)
  if (apiParams.category_slug)
    queryString.append('category_slug', apiParams.category_slug)
  if (apiParams.category) queryString.append('category', apiParams.category)
  if (apiParams.country_slug)
    queryString.append('country_slug', apiParams.country_slug)
  if (apiParams.country) queryString.append('country', apiParams.country)
  if (apiParams.province_slug)
    queryString.append('province_slug', apiParams.province_slug)
  if (apiParams.province)
    queryString.append('province', String(apiParams.province))
  if (apiParams.city_slug) queryString.append('city_slug', apiParams.city_slug)
  if (apiParams.city)
    queryString.append('city', String(apiParams.city))
  if (apiParams.topic) queryString.append('topic', apiParams.topic)
  if (apiParams.per_page)
    queryString.append('per_page', String(apiParams.per_page))
  if (apiParams.limit)
    queryString.append('limit', String(apiParams.limit))
  if (apiParams.page) queryString.append('page', String(apiParams.page))

  const qs = queryString.toString()
  const endpoint = `/articles${qs ? '?' + qs : ''}`

  console.log('[NewsAPI] Fetching real articles:', endpoint)
  return await fetchNewsFromProxy<PaginatedResponse<ExternalArticle>>(
    endpoint
  )
}

/**
 * Fetch single article by slug - API only, no fallback
 */
export async function getArticleBySlug(
  slug: string,
  useMockData?: boolean
): Promise<ExternalArticle | null> {
  console.log('[NewsAPI] Fetching article by slug:', slug)
  
  try {
    // Fetch from real API only
    const response = await fetchNewsFromProxy<{
      article: ExternalArticle
    }>(`/articles/${slug}`)
    return response.article
  } catch (error) {
    console.error(`[NewsAPI] Failed to fetch article ${slug}:`, error)
    throw error // No fallback - let error bubble up
  }
}

/**
 * Get all articles from API
 * Deduplicates by slug in case of duplicates
 */
export async function getAllArticlesMerged(
  useMockData?: boolean
): Promise<ExternalArticle[]> {
  const result = await getArticles({ useMockData })
  
  // Deduplicate by slug
  const seen = new Map<string, ExternalArticle>()
  for (const article of result.data.data) {
    if (!seen.has(article.slug)) {
      seen.set(article.slug, article)
    }
  }
  
  return [...seen.values()].sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  )
}

/**
 * Get articles filtered by category
 */
export async function getArticlesByCategory(
  categorySlug: string,
  options?: { page?: number; perPage?: number; useMockData?: boolean }
): Promise<PaginatedResponse<ExternalArticle>> {
  return getArticles({
    category_slug: categorySlug,
    page: options?.page,
    per_page: options?.perPage,
    useMockData: options?.useMockData,
  })
}

/**
 * Get articles filtered by location/city
 */
export async function getArticlesByCity(
  city: string,
  options?: { page?: number; perPage?: number; useMockData?: boolean }
): Promise<PaginatedResponse<ExternalArticle>> {
  return getArticles({
    city_slug: city,
    page: options?.page,
    per_page: options?.perPage,
    useMockData: options?.useMockData,
  })
}

/**
 * Search articles
 */
export async function searchArticles(
  query: string,
  options?: { page?: number; perPage?: number; useMockData?: boolean }
): Promise<PaginatedResponse<ExternalArticle>> {
  return getArticles({
    search: query,
    page: options?.page,
    per_page: options?.perPage,
    useMockData: options?.useMockData,
  })
}
