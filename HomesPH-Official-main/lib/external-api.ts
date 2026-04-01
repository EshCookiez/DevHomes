/**
 * External HomesPhNews API Integration
 * Connects to the external news API as documented in External.MD
 */

// ─── Types ─────────────────────────────────────────────────────────────────
export interface ContentBlock {
  id?: string | number
  type: string
  content?: any
  settings?: {
    textAlign?: string
    fontSize?: string
    color?: string
    fontWeight?: string
    isItalic?: boolean
    isUnderline?: boolean
    listType?: 'bullet' | 'number'
  }
  image?: string
  caption?: string
}

export interface ExternalArticle {
  id: string
  slug: string
  title: string
  summary?: string
  category?: string
  category_slug?: string
  country?: string
  status?: string
  published_at: string
  created_at?: string
  views_count?: number
  image?: string
  location?: string
  description?: string
  date?: string
  views?: number
  published_sites?: string[]
  topics?: string[]
  keywords?: string[]
  content_blocks?: ContentBlock[]
  author?: string
  province_id?: number
  city_id?: number
  province_slug?: string
  city_slug?: string
  province_name?: string
  city_name?: string
  excerpt?: string
}

export interface PaginatedResponse<T> {
  site: {
    name: string
    url: string
    description: string
  }
  data: {
    data: T[]
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
  }
}

export interface SingleArticleResponse {
  article: ExternalArticle
}

export interface Category {
  id: number
  name: string
  slug: string
}

export interface Country {
  id: string
  name: string
}

export interface Province {
  id: number
  name: string
  country_id: string
}

export interface City {
  city_id: number
  name: string
  province_id: number
  country_id: string
}

export interface Restaurant {
  id: string
  slug: string
  name: string
  description?: string
  country?: string
  city?: string
  cuisine_type?: string
  created_at?: string
  views_count?: number
  image?: string
}

export interface SubscriptionPayload {
  email: string
  categories: (number | string)[]
  countries: string[]
  company_name?: string
  features?: string
  time?: string
  logo?: File
}

// ─── Configuration ─────────────────────────────────────────────────────────
const API_BASEURL = process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'http://127.0.0.1:8000/api'
const API_KEY = process.env.NEXT_PUBLIC_EXTERNAL_API_KEY || ''

if (!API_KEY) {
  console.warn('[External API] NEXT_PUBLIC_EXTERNAL_API_KEY is not set')
}

// ─── Fetch Helper ──────────────────────────────────────────────────────────
async function fetchExternal<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASEURL}/external${endpoint}`
  
  const headers = new Headers(options.headers || {})
  
  // Add API key authentication
  if (API_KEY) {
    headers.set('X-Site-Key', API_KEY)
  }
  
  // Set content-type for JSON requests
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[External API] ${response.status} ${endpoint}`, errorText)
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return await response.json() as T
  } catch (error) {
    console.error(`[External API] Failed to fetch ${endpoint}:`, error)
    throw error
  }
}

// ─── Articles ──────────────────────────────────────────────────────────────

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

/**
 * Fetch articles with optional filtering
 */
export async function fetchArticles(
  params: ArticleListParams = {}
): Promise<PaginatedResponse<ExternalArticle>> {
  const queryString = new URLSearchParams()
  
  if (params.search) queryString.append('search', params.search)
  if (params.q) queryString.append('q', params.q)
  if (params.category_slug) queryString.append('category_slug', params.category_slug)
  if (params.category) queryString.append('category', params.category)
  if (params.country_slug) queryString.append('country_slug', params.country_slug)
  if (params.country) queryString.append('country', params.country)
  if (params.province_slug) queryString.append('province_slug', params.province_slug)
  if (params.province) queryString.append('province', String(params.province))
  if (params.city_slug) queryString.append('city_slug', params.city_slug)
  if (params.city) queryString.append('city', String(params.city))
  if (params.topic) queryString.append('topic', params.topic)
  if (params.per_page) queryString.append('per_page', String(params.per_page))
  if (params.limit) queryString.append('limit', String(params.limit))
  if (params.page) queryString.append('page', String(params.page))

  const qs = queryString.toString()
  const endpoint = `/articles${qs ? '?' + qs : ''}`
  
  return fetchExternal<PaginatedResponse<ExternalArticle>>(endpoint)
}

/**
 * Fetch a single article by UUID or slug
 */
export async function fetchArticleByIdentifier(
  identifier: string
): Promise<SingleArticleResponse> {
  return fetchExternal<SingleArticleResponse>(`/articles/${identifier}`)
}

// ─── Restaurants ───────────────────────────────────────────────────────────

export interface RestaurantListParams {
  search?: string
  country?: string
  city?: string
  cuisine_type?: string
  topic?: string
  per_page?: number
  limit?: number
  page?: number
}

/**
 * Fetch restaurants with optional filtering
 */
export async function fetchRestaurants(
  params: RestaurantListParams = {}
): Promise<PaginatedResponse<Restaurant>> {
  const queryString = new URLSearchParams()
  
  if (params.search) queryString.append('search', params.search)
  if (params.country) queryString.append('country', params.country)
  if (params.city) queryString.append('city', params.city)
  if (params.cuisine_type) queryString.append('cuisine_type', params.cuisine_type)
  if (params.topic) queryString.append('topic', params.topic)
  if (params.per_page) queryString.append('per_page', String(params.per_page))
  if (params.limit) queryString.append('limit', String(params.limit))
  if (params.page) queryString.append('page', String(params.page))

  const qs = queryString.toString()
  const endpoint = `/restaurants${qs ? '?' + qs : ''}`
  
  return fetchExternal<PaginatedResponse<Restaurant>>(endpoint)
}

// ─── Subscription ──────────────────────────────────────────────────────────

/**
 * Register subscription from partner widget
 */
export async function subscribeToNewsletter(
  payload: SubscriptionPayload
): Promise<any> {
  const formData = new FormData()
  formData.append('email', payload.email)
  
  payload.categories.forEach((cat) => {
    formData.append('categories[]', String(cat))
  })
  
  payload.countries.forEach((country) => {
    formData.append('countries[]', country)
  })
  
  if (payload.company_name) {
    formData.append('company_name', payload.company_name)
  }
  if (payload.features) {
    formData.append('features', payload.features)
  }
  if (payload.time) {
    formData.append('time', payload.time)
  }
  if (payload.logo) {
    formData.append('logo', payload.logo)
  }

  return fetchExternal('/subscribe', {
    method: 'POST',
    body: formData,
    headers: {} // Let fetch set Content-Type for FormData
  })
}

// ─── Categories ────────────────────────────────────────────────────────────

/**
 * Fetch all active categories
 */
export async function fetchCategories(): Promise<Category[]> {
  return fetchExternal<Category[]>('/categories')
}

/**
 * Fetch valid category + country pairs
 */
export async function fetchCategoryCountryPairs(): Promise<any> {
  return fetchExternal('/categories/countries')
}

// ─── Countries ─────────────────────────────────────────────────────────────

/**
 * Fetch all active countries
 */
export async function fetchCountries(): Promise<Country[]> {
  return fetchExternal<Country[]>('/countries')
}

/**
 * Fetch provinces for a country
 */
export async function fetchProvinces(
  countryId: string
): Promise<Province[]> {
  return fetchExternal<Province[]>(`/countries/${countryId}/provinces`)
}

/**
 * Fetch cities for a province (or country)
 */
export async function fetchCities(
  countryId: string,
  provinceId?: number | string
): Promise<City[]> {
  if (provinceId) {
    return fetchExternal<City[]>(
      `/countries/${countryId}/provinces/${provinceId}/cities`
    )
  }
  return fetchExternal<City[]>(`/countries/${countryId}/provinces`)
}

// ─── Metadata ──────────────────────────────────────────────────────────────

/**
 * Fetch provinces (with optional country filter)
 */
export async function fetchAllProvinces(
  countryId?: string
): Promise<Province[]> {
  const qs = countryId ? `?country_id=${countryId}` : ''
  return fetchExternal<Province[]>(`/provinces${qs}`)
}

/**
 * Fetch cities (with optional country and province filters)
 */
export async function fetchAllCities(
  countryId?: string,
  provinceId?: number
): Promise<City[]> {
  const params = new URLSearchParams()
  if (countryId) params.append('country_id', countryId)
  if (provinceId) params.append('province_id', String(provinceId))
  
  const qs = params.toString() ? '?' + params.toString() : ''
  return fetchExternal<City[]>(`/cities${qs}`)
}

// ─── Content Block Rendering ───────────────────────────────────────────────

/**
 * Safely render content blocks as HTML
 * Mirrors the HomesPhNews internal rendering behavior
 */
export function renderContentBlocks(blocks: ContentBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) {
    return ''
  }

  return blocks
    .map((block) => renderSingleBlock(block))
    .join('')
}

/**
 * Render a single content block
 */
function renderSingleBlock(block: ContentBlock): string {
  if (!block || !block.type) return ''

  const settings = block.settings || {}
  
  // Build style string from settings
  const styleArray: string[] = []
  if (settings.textAlign) styleArray.push(`text-align: ${settings.textAlign}`)
  if (settings.fontSize) styleArray.push(`font-size: ${settings.fontSize}`)
  if (settings.color) styleArray.push(`color: ${settings.color}`)
  if (settings.fontWeight) styleArray.push(`font-weight: ${settings.fontWeight}`)
  if (settings.isItalic) styleArray.push('font-style: italic')
  if (settings.isUnderline) styleArray.push('text-decoration: underline')
  
  const style = styleArray.length > 0 ? ` style="${styleArray.join(';')}"` : ''

  switch (block.type) {
    case 'text':
      // HTML string in content.text - safe to inject as-is
      return `<p${style}>${block.content?.text || ''}</p>`

    case 'image':
    case 'centered-image': {
      const src = block.content?.src || block.image || ''
      const caption = block.content?.caption || block.caption || ''
      const alt = caption || 'Article image'
      
      if (!isValidImageUrl(src)) return ''
      
      return `
        <figure${style}>
          <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="width: 100%; height: auto;" />
          ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}
        </figure>
      `.trim()
    }

    case 'left-image':
    case 'right-image': {
      const src = block.content?.image || block.content?.src || block.image || ''
      const text = block.content?.text || ''
      const caption = block.content?.caption || block.caption || ''
      const alignment = block.type === 'left-image' ? 'left' : 'right'
      
      if (!isValidImageUrl(src)) return ''
      
      return `
        <div style="display: flex; gap: 1rem; align-items: flex-start; ${alignment === 'right' ? 'flex-direction: row-reverse;' : ''}">
          <img src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" style="flex: 0 0 40%; height: auto;" />
          <div style="flex: 1;">
            ${text}
            ${caption ? `<small style="display: block; margin-top: 0.5rem; color: #666;">${escapeHtml(caption)}</small>` : ''}
          </div>
        </div>
      `.trim()
    }

    case 'grid':
    case 'dynamic-images': {
      const images = block.content?.images || []
      if (!Array.isArray(images) || images.length === 0) return ''
      
      const validImages = images
        .filter(isValidImageUrl)
        .map((url) => `<img src="${escapeHtml(url)}" alt="Gallery" style="width: 100%; height: auto; aspect-ratio: 1;" />`)
      
      return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          ${validImages.join('')}
        </div>
      `.trim()
    }

    case 'split-left':
    case 'split-right': {
      const image = block.content?.image || block.image || ''
      const text = block.content?.text || ''
      const alignment = block.type === 'split-left' ? 'left' : 'right'
      
      if (!isValidImageUrl(image)) return ''
      
      return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center; ${alignment === 'right' ? 'direction: rtl;' : ''}">
          <img src="${escapeHtml(image)}" alt="Article visual" style="width: 100%; height: auto;" />
          <div>
            ${text}
          </div>
        </div>
      `.trim()
    }

    case 'heading': {
      const level = block.content?.level || 2
      const text = block.content?.text || ''
      return `<h${level}${style}>${escapeHtml(text)}</h${level}>`
    }

    case 'list': {
      const items = block.content?.items || []
      const listType = settings.listType || 'bullet'
      const tagName = listType === 'number' ? 'ol' : 'ul'
      
      const itemsHtml = items
        .map((item: string) => `<li>${escapeHtml(item)}</li>`)
        .join('')
      
      return `<${tagName}${style}>${itemsHtml}</${tagName}>`
    }

    default:
      return ''
  }
}

/**
 * Check if URL is valid HTTP(S) image URL
 */
function isValidImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  if (!text) return ''
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Convert content blocks to plain HTML string
 * Useful for fallback rendering or SEO
 */
export function blocksToHtml(blocks: ContentBlock[]): string {
  return renderContentBlocks(blocks)
}

// ─── Utility: Get Featured Image ────────────────────────────────────────────

export function getArticleImage(article: ExternalArticle): string {
  return article.image || ''
}

// ─── Utility: Default to Mock Data ─────────────────────────────────────────

/**
 * Fetch articles with fallback to mock data if API fails
 * This allows graceful degradation during development
 */
export async function fetchArticlesWithFallback(
  params: ArticleListParams = {}
): Promise<PaginatedResponse<ExternalArticle>> {
  try {
    return await fetchArticles(params)
  } catch (error) {
    console.warn('[External API] Falling back to mock data:', error)
    // Return empty response - caller should handle fallback
    return {
      site: { name: '', url: '', description: '' },
      data: {
        data: [],
        current_page: 1,
        per_page: 20,
        total: 0,
        last_page: 0,
        from: 0,
        to: 0,
      },
    }
  }
}
