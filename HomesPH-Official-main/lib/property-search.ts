import 'server-only'

import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { toListingSlug } from '@/lib/url-slugs'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const MAX_OPENAI_OUTPUT_TOKENS = 400

const SPECIAL_FEATURE_OPTIONS = [
  'Parking',
  'Balcony',
  'Furnished',
  'Fully Furnished',
  'Semi-Furnished',
  'Unfurnished',
  'Ready for Occupancy',
] as const

const PROPERTY_TYPE_ALIASES: Record<string, string> = {
  condo: 'Condominium',
  condominium: 'Condominium',
  condos: 'Condominium',
  apartments: 'Apartment',
  apartment: 'Apartment',
  house: 'House & Lot',
  'house and lot': 'House & Lot',
  'house lot': 'House & Lot',
  townhouse: 'Townhouse',
  townhome: 'Townhouse',
  lot: 'Lot Only',
  lots: 'Lot Only',
  commercial: 'Commercial',
  office: 'Commercial',
  residential: 'Residential',
}

const FEATURE_ALIASES: Record<string, string> = {
  balcony: 'Balcony',
  carport: 'Parking',
  cctv: '24/7 CCTV',
  clubhouse: 'Clubhouse',
  'club house': 'Clubhouse',
  furnished: 'Furnished',
  'fully furnished': 'Fully Furnished',
  garage: 'Parking',
  gym: 'Fitness Gym',
  parking: 'Parking',
  pool: 'Swimming Pool',
  'ready for occupancy': 'Ready for Occupancy',
  rfo: 'Ready for Occupancy',
  'semi furnished': 'Semi-Furnished',
  'semi-furnished': 'Semi-Furnished',
  security: '24/7 Security',
  'swimming pool': 'Swimming Pool',
  unfurnished: 'Unfurnished',
}

export function hasConfiguredPropertyQueryProvider() {
  return Boolean(process.env.OPENAI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim())
}

const parsedPropertyQuerySchema = z.object({
  mode: z.enum(['buy', 'rent', 'unknown']).default('unknown'),
  propertyType: z.string().trim().nullable().default(null),
  city: z.string().trim().nullable().default(null),
  province: z.string().trim().nullable().default(null),
  barangay: z.string().trim().nullable().default(null),
  minPrice: z.number().int().nonnegative().nullable().default(null),
  maxPrice: z.number().int().nonnegative().nullable().default(null),
  bedrooms: z.number().int().min(0).max(20).nullable().default(null),
  bathrooms: z.number().int().min(0).max(20).nullable().default(null),
  features: z.array(z.string().trim()).default([]),
  keywords: z.array(z.string().trim()).default([]),
})

const propertyQueryJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    mode: {
      type: 'string',
      enum: ['buy', 'rent', 'unknown'],
      description: 'Whether the user intends to buy, rent, or did not make the intent clear.',
    },
    propertyType: {
      type: ['string', 'null'],
      description: 'Best matching Homes.ph property type when clearly stated.',
    },
    city: {
      type: ['string', 'null'],
      description: 'City or municipality when explicitly stated and grounded in the supplied taxonomy.',
    },
    province: {
      type: ['string', 'null'],
      description: 'Province when explicitly stated and grounded in the supplied taxonomy.',
    },
    barangay: {
      type: ['string', 'null'],
      description: 'Barangay when explicitly stated and grounded in the supplied taxonomy.',
    },
    minPrice: {
      type: ['integer', 'null'],
      minimum: 0,
      description: 'Minimum budget in PHP.',
    },
    maxPrice: {
      type: ['integer', 'null'],
      minimum: 0,
      description: 'Maximum budget in PHP.',
    },
    bedrooms: {
      type: ['integer', 'null'],
      minimum: 0,
      maximum: 20,
      description: 'Minimum bedroom count requested by the user.',
    },
    bathrooms: {
      type: ['integer', 'null'],
      minimum: 0,
      maximum: 20,
      description: 'Minimum bathroom count requested by the user.',
    },
    features: {
      type: 'array',
      description: 'Requested amenities or unit features that exist in the supplied taxonomy.',
      items: { type: 'string' },
    },
    keywords: {
      type: 'array',
      description: 'Remaining important search words that should still be used as keyword filters.',
      items: { type: 'string' },
    },
  },
  required: [
    'mode',
    'propertyType',
    'city',
    'province',
    'barangay',
    'minPrice',
    'maxPrice',
    'bedrooms',
    'bathrooms',
    'features',
    'keywords',
  ],
} as const

const propertyQuerySuggestionsSchema = z.object({
  suggestions: z.array(z.string().trim().min(1)).min(1).max(8),
})

export type AiPropertyMode = z.infer<typeof parsedPropertyQuerySchema>['mode']
export type ListingSearchMode = 'sale' | 'rent'

type SearchParamValue = string | string[] | undefined
export type PropertySearchParamsInput = Record<string, SearchParamValue>

export interface ParsedPropertyQuery {
  mode: AiPropertyMode
  propertyType: string | null
  city: string | null
  province: string | null
  barangay: string | null
  minPrice: number | null
  maxPrice: number | null
  bedrooms: number | null
  bathrooms: number | null
  features: string[]
  keywords: string[]
}

export interface PropertySearchFilters extends ParsedPropertyQuery {
  location: string | null
  sort: 'newest' | 'price-asc' | 'price-desc'
  ai: boolean
  aiQuery: string | null
  keywordsText: string
}

interface ListingRow {
  id: number
  title: string
  description: string | null
  listing_type: string | null
  status: string | null
  currency: string | null
  price: number | null
  negotiable: boolean | null
  is_featured: boolean | null
  created_at: string | null
  developer_id: number | null
  project_id: number | null
  project_unit_id: number | null
  user_profile_id: string | null
}

interface ProjectRow {
  id: number
  developer_id: number | null
  name: string
  slug: string
  city_municipality: string | null
  province: string | null
  barangay: string | null
  region: string | null
  project_type: string | null
  classification: string | null
  main_image_url: string | null
  latitude: number | null
  longitude: number | null
}

interface ProjectUnitRow {
  id: number
  project_id: number
  unit_name: string | null
  unit_type: string
  bedrooms: number | null
  bathrooms: number | null
  floor_area_sqm: number | null
  lot_area_sqm: number | null
  has_parking: boolean | null
  has_balcony: boolean | null
  is_furnished: string | null
  is_rfo: boolean | null
  selling_price: number | null
}

interface DeveloperRow {
  id: number
  developer_name: string
  logo_url: string | null
}

interface GalleryRow {
  id: number
  listing_id: number
  image_url: string
  display_order: number | null
}

interface ProjectAmenityRow {
  project_id: number
  amenity_id: number
}

interface AmenityRow {
  id: number
  name: string
}

interface SearchTaxonomyProjectRow {
  city_municipality: string | null
  province: string | null
  barangay: string | null
  project_type: string | null
}

interface SearchTaxonomy {
  propertyTypes: string[]
  cities: string[]
  provinces: string[]
  barangays: string[]
  features: string[]
}

export interface PublicListingSearchRecord {
  id: number
  title: string
  description: string | null
  listing_type: string | null
  status: string | null
  currency: string | null
  price: number | null
  negotiable: boolean | null
  is_featured: boolean | null
  created_at: string | null
  developers_profiles: {
    developer_name: string | null
    logo_url: string | null
  } | null
  user_profiles: {
    profile_image_url: string | null
  } | null
  projects: {
    id: number
    name: string
    slug: string
    city_municipality: string | null
    province: string | null
    barangay: string | null
    region: string | null
    project_type: string | null
    classification: string | null
    main_image_url: string | null
    latitude: number | null
    longitude: number | null
  } | null
  project_units: {
    id: number
    project_id: number
    unit_name: string | null
    unit_type: string
    bedrooms: number | null
    bathrooms: number | null
    floor_area_sqm: number | null
    lot_area_sqm: number | null
    has_parking: boolean | null
    has_balcony: boolean | null
    is_furnished: string | null
    is_rfo: boolean | null
    selling_price: number | null
  } | null
  property_listing_galleries: Array<{
    id: number
    listing_id: number
    image_url: string
    display_order: number | null
  }>
  project_amenities: string[]
}

export interface ProjectDetails {
  id: number
  name: string
  slug: string
  description: string | null
  project_type: string | null
  city_municipality: string | null
  province: string | null
  barangay: string | null
  address_details: string | null
  main_image_url: string | null
  developer?: {
    developer_name: string | null
    logo_url: string | null
  }
  units: Array<{
    id: number
    unit_name: string | null
    unit_type: string
    floor_area_sqm: number | null
    lot_area_sqm: number | null
    bedrooms: number | null
    bathrooms: number | null
    selling_price: number | null
  }>
  gallery: Array<{
    image_url: string
    title: string | null
  }>
}

export interface PublicListingSearchResult {
  filters: PropertySearchFilters
  listings: PublicListingSearchRecord[]
  propertyTypeChips: string[]
  aiSummary: string | null
  selectedProject?: ProjectDetails
}

function normalizeText(value: string | null | undefined) {
  if (!value) return ''

  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Map<string, string>()

  for (const value of values) {
    const trimmed = value?.trim()
    if (!trimmed) continue
    const normalized = normalizeText(trimmed)
    if (!normalized || seen.has(normalized)) continue
    seen.set(normalized, trimmed)
  }

  return Array.from(seen.values())
}

function uniqueNumbers(values: Array<number | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is number => Number.isFinite(value ?? NaN))))
}

function getStringParam(searchParams: PropertySearchParamsInput, key: string) {
  const value = searchParams[key]

  if (Array.isArray(value)) {
    const first = value[0]?.trim()
    return first ? first : null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  return null
}

function parseInteger(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null

  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null

  return Math.max(0, Math.trunc(parsed))
}

function splitCommaSeparatedList(value: string | null | undefined) {
  if (!value) return []
  return uniqueStrings(
    value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  )
}

function scoreOptionMatch(input: string, option: string) {
  if (!input || !option) return 0
  if (input === option) return 100
  if (option.includes(input)) return 80 - Math.max(0, option.length - input.length)
  if (input.includes(option)) return 70 - Math.max(0, input.length - option.length)

  const inputTokens = new Set(input.split(' ').filter(Boolean))
  const optionTokens = option.split(' ').filter(Boolean)
  let overlap = 0

  for (const token of optionTokens) {
    if (inputTokens.has(token)) {
      overlap += 1
    }
  }

  return overlap * 12
}

function findBestMatch(
  rawValue: string | null | undefined,
  options: string[],
  aliases?: Record<string, string>
) {
  const normalizedValue = normalizeText(rawValue)
  if (!normalizedValue) return null

  const aliasTarget = aliases?.[normalizedValue]
  if (aliasTarget) {
    const exactAliasOption = options.find(
      (option) => normalizeText(option) === normalizeText(aliasTarget)
    )
    if (exactAliasOption) {
      return exactAliasOption
    }
  }

  let bestMatch: string | null = aliasTarget ?? null
  let bestScore = aliasTarget ? 40 : 0

  for (const option of options) {
    const score = scoreOptionMatch(normalizedValue, normalizeText(option))
    if (score > bestScore) {
      bestScore = score
      bestMatch = option
    }
  }

  return bestScore >= 24 ? bestMatch : null
}

function normalizeMode(value: string | null | undefined): AiPropertyMode {
  const normalized = normalizeText(value)

  if (
    normalized === 'buy' ||
    normalized === 'sale' ||
    normalized === 'for sale' ||
    normalized === 'purchase' ||
    normalized === 'own'
  ) {
    return 'buy'
  }

  if (
    normalized === 'rent' ||
    normalized === 'rental' ||
    normalized === 'lease' ||
    normalized === 'for rent'
  ) {
    return 'rent'
  }

  return 'unknown'
}

function normalizeFeatures(rawFeatures: string[], options: string[]) {
  return uniqueStrings(
    rawFeatures.map((feature) => findBestMatch(feature, options, FEATURE_ALIASES) ?? null)
  )
}

function joinKeywordsText(keywords: string[]) {
  return keywords.join(', ')
}

function formatLocationLabelFromSlug(slug: string | null | undefined) {
  if (!slug) return null

  const label = decodeURIComponent(slug)
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')

  return label || null
}

function normalizeParsedPropertyQuery(
  parsed: ParsedPropertyQuery,
  taxonomy: SearchTaxonomy
): ParsedPropertyQuery {
  const keywords = [...parsed.keywords]
  const rawLocationFragments = [parsed.city, parsed.province, parsed.barangay]

  const propertyType = findBestMatch(parsed.propertyType, taxonomy.propertyTypes, PROPERTY_TYPE_ALIASES)
  const city = findBestMatch(parsed.city, taxonomy.cities)
  const province = findBestMatch(parsed.province, taxonomy.provinces)
  const barangay = findBestMatch(parsed.barangay, taxonomy.barangays)
  const features = normalizeFeatures(parsed.features, taxonomy.features)

  if (parsed.propertyType && !propertyType) {
    keywords.push(parsed.propertyType)
  }

  for (const [index, rawValue] of rawLocationFragments.entries()) {
    if (!rawValue) continue
    const matched = index === 0 ? city : index === 1 ? province : barangay
    if (!matched) {
      keywords.push(rawValue)
    }
  }

  let minPrice = parseInteger(parsed.minPrice)
  let maxPrice = parseInteger(parsed.maxPrice)

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    ;[minPrice, maxPrice] = [maxPrice, minPrice]
  }

  return {
    mode: normalizeMode(parsed.mode),
    propertyType,
    city,
    province,
    barangay,
    minPrice,
    maxPrice,
    bedrooms: parseInteger(parsed.bedrooms),
    bathrooms: parseInteger(parsed.bathrooms),
    features,
    keywords: uniqueStrings(keywords),
  }
}

async function selectAllRows<T>(
  queryFactory: () => {
    range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
  },
  pageSize = 1000
) {
  const rows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await queryFactory().range(from, from + pageSize - 1)
    if (error) {
      throw new Error(error.message)
    }

    const page = data ?? []
    rows.push(...page)

    if (page.length < pageSize) {
      break
    }

    from += pageSize
  }

  return rows
}

async function getPropertySearchTaxonomy() {
  const admin = createAdminSupabaseClient()

  const [propertyTypes, amenities, projects] = await Promise.all([
    selectAllRows<{ name: string }>(() => admin.from('property_types').select('name').order('name', { ascending: true })),
    selectAllRows<{ name: string }>(() => admin.from('amenities').select('name').order('name', { ascending: true })),
    selectAllRows<SearchTaxonomyProjectRow>(() =>
      admin
        .from('projects')
        .select('city_municipality,province,barangay,project_type')
        .order('id', { ascending: true })
    ),
  ])

  return {
    propertyTypes: uniqueStrings([
      ...propertyTypes.map((row) => row.name),
      ...projects.map((row) => row.project_type),
    ]),
    cities: uniqueStrings(projects.map((row) => row.city_municipality)),
    provinces: uniqueStrings(projects.map((row) => row.province)),
    barangays: uniqueStrings(projects.map((row) => row.barangay)),
    features: uniqueStrings([
      ...amenities.map((row) => row.name),
      ...SPECIAL_FEATURE_OPTIONS,
    ]),
  } satisfies SearchTaxonomy
}

function buildParserInstructions() {
  return [
    'You parse Homes.ph property search queries into structured filters only.',
    'Never generate listings, recommendations, explanations, or extra text.',
    'Use only the supplied Homes.ph taxonomy for property types, locations, and features.',
    'If a value is not grounded in the supplied taxonomy, leave that field null and place the leftover concept in keywords.',
    'If the user does not clearly say buy or rent, set mode to unknown.',
    'If the user gives an upper budget, set maxPrice. If they give a lower budget, set minPrice.',
    'Bedrooms and bathrooms should be minimum requested counts.',
    'If a page location context is supplied and the user does not explicitly mention another location, leave city, province, and barangay as null so the app can use the fallback location.',
    'Return JSON matching the schema exactly.',
  ].join('\n')
}

function buildParserPrompt(
  query: string,
  locationSlug: string | null,
  taxonomy: SearchTaxonomy
) {
  return JSON.stringify(
    {
      query,
      fallbackLocationContext: formatLocationLabelFromSlug(locationSlug),
      availableFilters: {
        propertyTypes: taxonomy.propertyTypes,
        cities: taxonomy.cities,
        provinces: taxonomy.provinces,
        barangays: taxonomy.barangays,
        features: taxonomy.features,
      },
    },
    null,
    2
  )
}

function buildPropertySuggestionJsonSchema(count: number) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      suggestions: {
        type: 'array',
        description:
          'Concise Homes.ph property search suggestions written as search queries, not sentences.',
        items: { type: 'string' },
        minItems: count,
        maxItems: count,
      },
    },
    required: ['suggestions'],
  } as const
}

function buildSuggestionInstructions(count: number) {
  return [
    'You generate Homes.ph property search suggestions only.',
    'Return JSON matching the schema exactly.',
    `Return exactly ${count} suggestions.`,
    'Suggestions must be concise natural-language search queries, not full sentences.',
    'Use only the supplied Homes.ph taxonomy for property types, locations, and features.',
    'Use the supplied page location context by default unless the partial query clearly asks for another location.',
    'If a partial query is supplied, refine or complete it into highly likely property search intents.',
    'Prefer specific, high-intent suggestions involving property type, neighborhood, bedroom count, budget, or amenities when grounded in the taxonomy.',
    'Do not include numbering, bullets, explanations, duplicate suggestions, or markdown.',
  ].join('\n')
}

function buildSuggestionPrompt(
  query: string | null,
  locationSlug: string | null,
  taxonomy: SearchTaxonomy,
  count: number
) {
  return JSON.stringify(
    {
      partialQuery: query?.trim() || null,
      fallbackLocationContext: formatLocationLabelFromSlug(locationSlug),
      suggestionCount: count,
      availableFilters: {
        propertyTypes: taxonomy.propertyTypes,
        cities: taxonomy.cities,
        provinces: taxonomy.provinces,
        barangays: taxonomy.barangays,
        features: taxonomy.features,
      },
    },
    null,
    2
  )
}

function normalizeSuggestedQueries(suggestions: string[], count: number) {
  return uniqueStrings(
    suggestions.map((suggestion) =>
      suggestion
        .replace(/^['"`]+|['"`]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
  ).slice(0, count)
}

function extractOpenAiTextPayload(payload: any) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  const parts: string[] = []

  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string' && content.text.trim()) {
        parts.push(content.text.trim())
      }
    }
  }

  return parts.join('\n').trim()
}

async function parsePropertyQueryWithOpenAI(
  query: string,
  locationSlug: string | null,
  taxonomy: SearchTaxonomy
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_PROPERTY_QUERY_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
      max_output_tokens: MAX_OPENAI_OUTPUT_TOKENS,
      input: [
        {
          role: 'developer',
          content: buildParserInstructions(),
        },
        {
          role: 'user',
          content: buildParserPrompt(query, locationSlug, taxonomy),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'homesph_property_query_filters',
          strict: true,
          schema: propertyQueryJsonSchema,
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI property parser failed: ${response.status} ${errorText.slice(0, 300)}`)
  }

  const payload = await response.json()
  const rawText = extractOpenAiTextPayload(payload)

  if (!rawText) {
    throw new Error('OpenAI property parser returned an empty response.')
  }

  return parsedPropertyQuerySchema.parse(JSON.parse(rawText))
}

async function suggestPropertyQueriesWithOpenAI(
  query: string | null,
  locationSlug: string | null,
  taxonomy: SearchTaxonomy,
  count: number
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_PROPERTY_QUERY_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
      max_output_tokens: MAX_OPENAI_OUTPUT_TOKENS,
      input: [
        {
          role: 'developer',
          content: buildSuggestionInstructions(count),
        },
        {
          role: 'user',
          content: buildSuggestionPrompt(query, locationSlug, taxonomy, count),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'homesph_property_query_suggestions',
          strict: true,
          schema: buildPropertySuggestionJsonSchema(count),
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI property suggestions failed: ${response.status} ${errorText.slice(0, 300)}`)
  }

  const payload = await response.json()
  const rawText = extractOpenAiTextPayload(payload)

  if (!rawText) {
    throw new Error('OpenAI property suggestions returned an empty response.')
  }

  const parsed = propertyQuerySuggestionsSchema.parse(JSON.parse(rawText))
  return normalizeSuggestedQueries(parsed.suggestions, count)
}

async function parsePropertyQueryWithGemini(
  query: string,
  locationSlug: string | null,
  taxonomy: SearchTaxonomy
) {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) return null

  const model = process.env.GEMINI_PROPERTY_QUERY_MODEL?.trim() || DEFAULT_GEMINI_MODEL
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${buildParserInstructions()}\n\n${buildParserPrompt(query, locationSlug, taxonomy)}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: propertyQueryJsonSchema,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini property parser failed: ${response.status} ${errorText.slice(0, 300)}`)
  }

  const payload = await response.json()
  const rawText =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('\n')
      .trim() ?? ''

  if (!rawText) {
    throw new Error('Gemini property parser returned an empty response.')
  }

  return parsedPropertyQuerySchema.parse(JSON.parse(rawText))
}

async function suggestPropertyQueriesWithGemini(
  query: string | null,
  locationSlug: string | null,
  taxonomy: SearchTaxonomy,
  count: number
) {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) return null

  const model = process.env.GEMINI_PROPERTY_QUERY_MODEL?.trim() || DEFAULT_GEMINI_MODEL
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${buildSuggestionInstructions(count)}\n\n${buildSuggestionPrompt(query, locationSlug, taxonomy, count)}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: buildPropertySuggestionJsonSchema(count),
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini property suggestions failed: ${response.status} ${errorText.slice(0, 300)}`)
  }

  const payload = await response.json()
  const rawText =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('\n')
      .trim() ?? ''

  if (!rawText) {
    throw new Error('Gemini property suggestions returned an empty response.')
  }

  const parsed = propertyQuerySuggestionsSchema.parse(JSON.parse(rawText))
  return normalizeSuggestedQueries(parsed.suggestions, count)
}

export async function parseNaturalLanguagePropertyQuery(
  query: string,
  locationSlug?: string | null
) {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    throw new Error('A search query is required.')
  }

  const taxonomy = await getPropertySearchTaxonomy()
  const errors: string[] = []

  try {
    const openAiResult = await parsePropertyQueryWithOpenAI(trimmedQuery, locationSlug ?? null, taxonomy)
    if (openAiResult) {
      return normalizeParsedPropertyQuery(openAiResult, taxonomy)
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'OpenAI property parser failed.')
  }

  try {
    const geminiResult = await parsePropertyQueryWithGemini(trimmedQuery, locationSlug ?? null, taxonomy)
    if (geminiResult) {
      return normalizeParsedPropertyQuery(geminiResult, taxonomy)
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Gemini property parser failed.')
  }

  throw new Error(errors[0] ?? 'No AI provider is configured for property parsing.')
}

export async function generatePropertyQuerySuggestions(
  query?: string | null,
  locationSlug?: string | null,
  options?: {
    count?: number
  }
) {
  const suggestionCount = Math.max(1, Math.min(options?.count ?? 4, 8))
  const trimmedQuery = query?.trim() || null
  const taxonomy = await getPropertySearchTaxonomy()
  const errors: string[] = []

  try {
    const openAiResult = await suggestPropertyQueriesWithOpenAI(
      trimmedQuery,
      locationSlug ?? null,
      taxonomy,
      suggestionCount
    )
    if (openAiResult && openAiResult.length > 0) {
      return openAiResult
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'OpenAI property suggestions failed.')
  }

  try {
    const geminiResult = await suggestPropertyQueriesWithGemini(
      trimmedQuery,
      locationSlug ?? null,
      taxonomy,
      suggestionCount
    )
    if (geminiResult && geminiResult.length > 0) {
      return geminiResult
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Gemini property suggestions failed.')
  }

  throw new Error(errors[0] ?? 'No AI provider is configured for property suggestions.')
}

function parsePropertySearchFilters(searchParams: PropertySearchParamsInput): PropertySearchFilters {
  const q = getStringParam(searchParams, 'q')
  const keywordParam = getStringParam(searchParams, 'keywords')
  const keywords = uniqueStrings([
    ...splitCommaSeparatedList(keywordParam),
    ...(q ? [q] : []),
  ])
  const features = splitCommaSeparatedList(getStringParam(searchParams, 'features'))
  const sort = getStringParam(searchParams, 'sort')

  return {
    mode: 'unknown',
    propertyType:
      getStringParam(searchParams, 'propertyType') ??
      getStringParam(searchParams, 'propertyCategory'),
    city: getStringParam(searchParams, 'city'),
    province: getStringParam(searchParams, 'province'),
    barangay: getStringParam(searchParams, 'barangay'),
    minPrice:
      parseInteger(getStringParam(searchParams, 'minPrice')) ??
      parseInteger(getStringParam(searchParams, 'min')),
    maxPrice:
      parseInteger(getStringParam(searchParams, 'maxPrice')) ??
      parseInteger(getStringParam(searchParams, 'max')),
    bedrooms:
      parseInteger(getStringParam(searchParams, 'bedrooms')) ??
      parseInteger(getStringParam(searchParams, 'beds')),
    bathrooms:
      parseInteger(getStringParam(searchParams, 'bathrooms')) ??
      parseInteger(getStringParam(searchParams, 'baths')),
    features,
    keywords,
    keywordsText: keywordParam ?? q ?? '',
    location: getStringParam(searchParams, 'location'),
    sort: sort === 'price-asc' || sort === 'price-desc' ? sort : 'newest',
    ai: ['1', 'true', 'yes'].includes(normalizeText(getStringParam(searchParams, 'ai'))),
    aiQuery: getStringParam(searchParams, 'aiQuery'),
  }
}

function buildSearchHaystack(listing: PublicListingSearchRecord) {
  return normalizeText(
    [
      listing.title,
      listing.description,
      listing.developers_profiles?.developer_name,
      listing.projects?.name,
      listing.projects?.city_municipality,
      listing.projects?.province,
      listing.projects?.barangay,
      listing.projects?.region,
      listing.projects?.project_type,
      listing.projects?.classification,
      listing.project_units?.unit_name,
      listing.project_units?.unit_type,
      ...listing.project_amenities,
    ]
      .filter(Boolean)
      .join(' ')
  )
}

function matchesLocationFragment(candidate: string | null | undefined, expected: string | null | undefined) {
  const normalizedCandidate = normalizeText(candidate)
  const normalizedExpected = normalizeText(expected)

  if (!normalizedCandidate || !normalizedExpected) {
    return false
  }

  return (
    normalizedCandidate === normalizedExpected ||
    normalizedCandidate.includes(normalizedExpected) ||
    normalizedExpected.includes(normalizedCandidate)
  )
}

function listingMatchesFeatures(listing: PublicListingSearchRecord, features: string[]) {
  if (features.length === 0) return true

  return features.every((feature) => {
    const normalizedFeature = normalizeText(feature)
    const amenityMatches = listing.project_amenities.some((amenity) =>
      matchesLocationFragment(amenity, feature)
    )

    if (amenityMatches) {
      return true
    }

    if (normalizedFeature === normalizeText('Parking')) {
      return listing.project_units?.has_parking === true
    }

    if (normalizedFeature === normalizeText('Balcony')) {
      return listing.project_units?.has_balcony === true
    }

    if (normalizedFeature === normalizeText('Ready for Occupancy')) {
      return listing.project_units?.is_rfo === true
    }

    const furnishedState = normalizeText(listing.project_units?.is_furnished)

    if (normalizedFeature === normalizeText('Furnished')) {
      return Boolean(furnishedState) && furnishedState !== normalizeText('Unfurnished')
    }

    if (normalizedFeature === normalizeText('Fully Furnished')) {
      return furnishedState.includes(normalizeText('Fully Furnished'))
    }

    if (normalizedFeature === normalizeText('Semi-Furnished')) {
      return furnishedState.includes(normalizeText('Semi-Furnished'))
    }

    if (normalizedFeature === normalizeText('Unfurnished')) {
      return furnishedState.includes(normalizeText('Unfurnished'))
    }

    return false
  })
}

function listingMatchesFilters(
  listing: PublicListingSearchRecord,
  filters: PropertySearchFilters
) {
  const haystack = buildSearchHaystack(listing)
  const project = listing.projects
  const unit = listing.project_units

  if (filters.keywords.length > 0) {
    const matchesKeywords = filters.keywords.every((keyword) =>
      haystack.includes(normalizeText(keyword))
    )

    if (!matchesKeywords) {
      return false
    }
  }

  if (filters.location) {
    const locationNeedle = filters.location.replace(/-/g, ' ')
    const matchesLocation =
      matchesLocationFragment(project?.city_municipality, locationNeedle) ||
      matchesLocationFragment(project?.province, locationNeedle) ||
      matchesLocationFragment(project?.barangay, locationNeedle) ||
      matchesLocationFragment(project?.region, locationNeedle)

    if (!matchesLocation) {
      return false
    }
  }

  if (filters.city && !matchesLocationFragment(project?.city_municipality, filters.city)) {
    return false
  }

  if (filters.province && !matchesLocationFragment(project?.province, filters.province)) {
    return false
  }

  if (filters.barangay && !matchesLocationFragment(project?.barangay, filters.barangay)) {
    return false
  }

  if (filters.propertyType) {
    const propertyTypeMatches =
      matchesLocationFragment(project?.project_type, filters.propertyType) ||
      matchesLocationFragment(project?.classification, filters.propertyType) ||
      matchesLocationFragment(unit?.unit_type, filters.propertyType) ||
      matchesLocationFragment(listing.title, filters.propertyType)

    if (!propertyTypeMatches) {
      return false
    }
  }

  if (filters.minPrice !== null && (listing.price ?? 0) < filters.minPrice) {
    return false
  }

  if (filters.maxPrice !== null && (listing.price ?? Number.MAX_SAFE_INTEGER) > filters.maxPrice) {
    return false
  }

  if (filters.bedrooms !== null && (unit?.bedrooms ?? -1) < filters.bedrooms) {
    return false
  }

  if (filters.bathrooms !== null && (unit?.bathrooms ?? -1) < filters.bathrooms) {
    return false
  }

  if (!listingMatchesFeatures(listing, filters.features)) {
    return false
  }

  return true
}

function sortListings(listings: PublicListingSearchRecord[], sort: PropertySearchFilters['sort']) {
  const sorted = [...listings]

  if (sort === 'price-asc') {
    sorted.sort((left, right) => (left.price ?? Number.MAX_SAFE_INTEGER) - (right.price ?? Number.MAX_SAFE_INTEGER))
    return sorted
  }

  if (sort === 'price-desc') {
    sorted.sort((left, right) => (right.price ?? -1) - (left.price ?? -1))
    return sorted
  }

  sorted.sort((left, right) => {
    const rightTime = right.created_at ? Date.parse(right.created_at) : 0
    const leftTime = left.created_at ? Date.parse(left.created_at) : 0
    return rightTime - leftTime || right.id - left.id
  })

  return sorted
}

function formatMoney(value: number) {
  return `PHP ${value.toLocaleString()}`
}

function buildAiSummary(filters: PropertySearchFilters, listingMode: ListingSearchMode) {
  if (!filters.ai) return null

  const summaryParts: string[] = [listingMode === 'sale' ? 'Buy' : 'Rent']

  if (filters.propertyType) {
    summaryParts.push(filters.propertyType)
  }

  const locationLabel =
    [filters.barangay, filters.city, filters.province].filter(Boolean).join(', ') ||
    formatLocationLabelFromSlug(filters.location)

  if (locationLabel) {
    summaryParts.push(locationLabel)
  }

  if (filters.minPrice !== null && filters.maxPrice !== null) {
    summaryParts.push(`${formatMoney(filters.minPrice)} to ${formatMoney(filters.maxPrice)}`)
  } else if (filters.maxPrice !== null) {
    summaryParts.push(`Under ${formatMoney(filters.maxPrice)}`)
  } else if (filters.minPrice !== null) {
    summaryParts.push(`From ${formatMoney(filters.minPrice)}`)
  }

  if (summaryParts.length < 4 && filters.bedrooms !== null) {
    summaryParts.push(`${filters.bedrooms}+ BR`)
  }

  if (summaryParts.length < 4 && filters.bathrooms !== null) {
    summaryParts.push(`${filters.bathrooms}+ Bath`)
  }

  if (summaryParts.length < 4 && filters.features.length > 0) {
    summaryParts.push(filters.features.slice(0, 2).join(' + '))
  }

  return summaryParts.join(' | ')
}

export async function searchPublicListings(
  listingMode: ListingSearchMode,
  searchParams: PropertySearchParamsInput
): Promise<PublicListingSearchResult> {
  const filters = parsePropertySearchFilters(searchParams)
  const admin = createAdminSupabaseClient()

  // Project Detection
  let selectedProject: ProjectDetails | undefined = undefined
  const searchText = filters.keywordsText || filters.location
  if (searchText && searchText.length > 2) {
    const { data: projectMatch } = await admin
      .from('projects')
      .select('id, name, slug, description, project_type, city_municipality, province, barangay, address_details, main_image_url, developer_id')
      .or(`name.ilike.%${searchText}%,slug.ilike.%${searchText}%`)
      .limit(1)
      .maybeSingle()

    if (projectMatch) {
      const [devResult, unitsResult, galleryResult] = await Promise.all([
        projectMatch.developer_id
          ? admin.from('developers_profiles').select('developer_name, logo_url').eq('id', projectMatch.developer_id).maybeSingle()
          : Promise.resolve({ data: null }),
        admin.from('project_units').select('id, unit_name, unit_type, floor_area_sqm, lot_area_sqm, bedrooms, bathrooms, selling_price').eq('project_id', projectMatch.id),
        admin.from('project_galleries').select('image_url, title').eq('project_id', projectMatch.id).order('display_order', { ascending: true })
      ])

      selectedProject = {
        id: projectMatch.id,
        name: projectMatch.name,
        slug: projectMatch.slug,
        description: projectMatch.description,
        project_type: projectMatch.project_type,
        city_municipality: projectMatch.city_municipality,
        province: projectMatch.province,
        barangay: projectMatch.barangay,
        address_details: projectMatch.address_details,
        main_image_url: projectMatch.main_image_url,
        developer: devResult.data
          ? { developer_name: devResult.data.developer_name, logo_url: devResult.data.logo_url }
          : undefined,
        units: (unitsResult.data || []).map(u => ({
          id: Number(u.id),
          unit_name: u.unit_name,
          unit_type: u.unit_type,
          floor_area_sqm: u.floor_area_sqm ? Number(u.floor_area_sqm) : null,
          lot_area_sqm: u.lot_area_sqm ? Number(u.lot_area_sqm) : null,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          selling_price: u.selling_price ? Number(u.selling_price) : null
        })),
        gallery: (galleryResult.data || []).map(g => ({
          image_url: g.image_url,
          title: g.title
        }))
      }
    }
  }

  const listingRows = await selectAllRows<ListingRow>(() => {
    let query = admin
      .from('property_listings')
      .select(
        'id,title,description,listing_type,status,currency,price,negotiable,is_featured,created_at,developer_id,project_id,project_unit_id,user_profile_id'
      )
      .eq('status', 'published')
      .eq('listing_type', listingMode)

    if (selectedProject) {
      query = query.eq('project_id', selectedProject.id)
    }

    return query.order('created_at', { ascending: false })
  })

  const projectIds = uniqueNumbers(listingRows.map((row) => row.project_id))
  const unitIds = uniqueNumbers(listingRows.map((row) => row.project_unit_id))
  const developerIds = uniqueNumbers(listingRows.map((row) => row.developer_id))
  const userProfileIds = Array.from(new Set(listingRows.map((row) => row.user_profile_id).filter((id): id is string => Boolean(id))))
  const listingIds = listingRows.map((row) => row.id)

  const [projects, units, developers, galleries, projectAmenities, userProfiles] = await Promise.all([
    projectIds.length > 0
      ? selectAllRows<ProjectRow>(() =>
        admin
          .from('projects')
          .select(
            'id,developer_id,name,slug,city_municipality,province,barangay,region,project_type,classification,main_image_url,latitude,longitude'
          )
          .in('id', projectIds)
      )
      : Promise.resolve([] as ProjectRow[]),
    unitIds.length > 0
      ? selectAllRows<ProjectUnitRow>(() =>
        admin
          .from('project_units')
          .select(
            'id,project_id,unit_name,unit_type,bedrooms,bathrooms,floor_area_sqm,lot_area_sqm,has_parking,has_balcony,is_furnished,is_rfo,selling_price'
          )
          .in('id', unitIds)
      )
      : Promise.resolve([] as ProjectUnitRow[]),
    developerIds.length > 0
      ? selectAllRows<DeveloperRow>(() =>
        admin
          .from('developers_profiles')
          .select('id,developer_name,logo_url')
          .in('id', developerIds)
      )
      : Promise.resolve([] as DeveloperRow[]),
    listingIds.length > 0
      ? selectAllRows<GalleryRow>(() =>
        admin
          .from('property_listing_galleries')
          .select('id,listing_id,image_url,display_order')
          .in('listing_id', listingIds)
          .order('display_order', { ascending: true })
      )
      : Promise.resolve([] as GalleryRow[]),
    projectIds.length > 0
      ? selectAllRows<ProjectAmenityRow>(() =>
        admin
          .from('project_amenities')
          .select('project_id,amenity_id')
          .in('project_id', projectIds)
      )
      : Promise.resolve([] as ProjectAmenityRow[]),
    userProfileIds.length > 0
      ? selectAllRows<{ id: string, profile_image_url: string }>(() =>
        admin
          .from('user_profiles')
          .select('id,profile_image_url')
          .in('id', userProfileIds)
      )
      : Promise.resolve([] as Array<{ id: string, profile_image_url: string }>),
  ])

  const amenityIds = uniqueNumbers(projectAmenities.map((row) => row.amenity_id))
  const amenities = amenityIds.length > 0
    ? await selectAllRows<AmenityRow>(() =>
      admin
        .from('amenities')
        .select('id,name')
        .in('id', amenityIds)
    )
    : []

  const projectMap = new Map(projects.map((project) => [project.id, project]))
  const unitMap = new Map(units.map((unit) => [unit.id, unit]))
  const developerMap = new Map(developers.map((developer) => [developer.id, developer]))
  const userProfileMap = new Map(userProfiles.map((u) => [u.id, u]))
  const amenityMap = new Map(amenities.map((amenity) => [amenity.id, amenity.name]))
  const galleryMap = new Map<number, GalleryRow[]>()
  const amenityNamesByProject = new Map<number, string[]>()

  for (const gallery of galleries) {
    const current = galleryMap.get(gallery.listing_id) ?? []
    current.push(gallery)
    current.sort((left, right) => (left.display_order ?? 0) - (right.display_order ?? 0))
    galleryMap.set(gallery.listing_id, current)
  }

  for (const projectAmenity of projectAmenities) {
    const amenityName = amenityMap.get(projectAmenity.amenity_id)
    if (!amenityName) continue

    const current = amenityNamesByProject.get(projectAmenity.project_id) ?? []
    current.push(amenityName)
    amenityNamesByProject.set(projectAmenity.project_id, uniqueStrings(current))
  }

  const joinedListings: PublicListingSearchRecord[] = listingRows.map((row) => {
    const project = row.project_id ? projectMap.get(row.project_id) ?? null : null
    const unit = row.project_unit_id ? unitMap.get(row.project_unit_id) ?? null : null
    const developer =
      row.developer_id
        ? developerMap.get(row.developer_id) ?? null
        : project?.developer_id
          ? developerMap.get(project.developer_id) ?? null
          : null

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      listing_type: row.listing_type,
      status: row.status,
      currency: row.currency,
      price: row.price,
      negotiable: row.negotiable,
      is_featured: row.is_featured,
      created_at: row.created_at,
      developers_profiles: developer
        ? {
          developer_name: developer.developer_name,
          logo_url: developer.logo_url,
        }
        : null,
      user_profiles: row.user_profile_id ? userProfileMap.get(row.user_profile_id) ?? null : null,
      projects: project
        ? {
          id: project.id,
          name: project.name,
          slug: project.slug,
          city_municipality: project.city_municipality,
          province: project.province,
          barangay: project.barangay,
          region: project.region,
          project_type: project.project_type,
          classification: project.classification,
          main_image_url: project.main_image_url,
          latitude: project.latitude,
          longitude: project.longitude,
        }
        : null,
      project_units: unit
        ? {
          id: unit.id,
          project_id: unit.project_id,
          unit_name: unit.unit_name,
          unit_type: unit.unit_type,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          floor_area_sqm: unit.floor_area_sqm,
          lot_area_sqm: unit.lot_area_sqm,
          has_parking: unit.has_parking,
          has_balcony: unit.has_balcony,
          is_furnished: unit.is_furnished,
          is_rfo: unit.is_rfo,
          selling_price: unit.selling_price,
        }
        : null,
      property_listing_galleries: galleryMap.get(row.id) ?? [],
      project_amenities: row.project_id ? amenityNamesByProject.get(row.project_id) ?? [] : [],
    }
  })

  const filteredListings = sortListings(
    joinedListings.filter((listing) => listingMatchesFilters(listing, filters)),
    filters.sort
  )

  return {
    filters,
    listings: filteredListings,
    propertyTypeChips: uniqueStrings(
      filteredListings
        .map((listing) => listing.projects?.project_type ?? listing.project_units?.unit_type ?? null)
        .slice(0, 8)
    ).slice(0, 5),
    aiSummary: buildAiSummary(filters, listingMode),
    selectedProject,
  }
}

export function buildPropertySearchUrl(
  mode: Exclude<AiPropertyMode, 'unknown'>,
  parsed: ParsedPropertyQuery,
  options?: {
    locationSlug?: string | null
    aiQuery?: string | null
  }
) {
  const params = new URLSearchParams()
  const pathname = mode === 'buy' ? '/buy' : '/rent'
  const fallbackLocation = options?.locationSlug?.trim()

  params.set('ai', '1')

  if (options?.aiQuery?.trim()) {
    params.set('aiQuery', options.aiQuery.trim())
  }

  if (parsed.propertyType) params.set('propertyType', parsed.propertyType)
  if (parsed.city) params.set('city', parsed.city)
  if (parsed.province) params.set('province', parsed.province)
  if (parsed.barangay) params.set('barangay', parsed.barangay)
  if (parsed.minPrice !== null) params.set('minPrice', String(parsed.minPrice))
  if (parsed.maxPrice !== null) params.set('maxPrice', String(parsed.maxPrice))
  if (parsed.bedrooms !== null) params.set('bedrooms', String(parsed.bedrooms))
  if (parsed.bathrooms !== null) params.set('bathrooms', String(parsed.bathrooms))
  if (parsed.features.length > 0) params.set('features', parsed.features.join(', '))
  if (parsed.keywords.length > 0) params.set('keywords', joinKeywordsText(parsed.keywords))

  const hasExplicitLocation = Boolean(parsed.city || parsed.province || parsed.barangay)
  if (!hasExplicitLocation && fallbackLocation) {
    params.set('location', fallbackLocation)
  }

  return `${pathname}?${params.toString()}`
}

export interface ListingDetailExtended extends PublicListingSearchRecord {
  agent: {
    full_name: string | null
    profile_image_url: string | null
    email: string | null
    phone: string | null
    role: string | null
  } | null
  recommended: PublicListingSearchRecord[]
}

export async function getListingById(id: number): Promise<PublicListingSearchRecord | null> {
  const admin = createAdminSupabaseClient()

  const { data: row, error } = await admin
    .from('property_listings')
    .select('id,title,description,listing_type,status,currency,price,negotiable,is_featured,created_at,developer_id,project_id,project_unit_id,user_profile_id')
    .eq('id', id)
    .maybeSingle()

  if (error || !row) return null

  const [projectResult, unitResult, developerResult, galleryResult, userProfileResult, projectAmenitiesResult] = await Promise.all([
    row.project_id 
      ? admin.from('projects').select('id,developer_id,name,slug,city_municipality,province,barangay,region,project_type,classification,main_image_url').eq('id', row.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
    row.project_unit_id
      ? admin.from('project_units').select('id,project_id,unit_name,unit_type,bedrooms,bathrooms,floor_area_sqm,lot_area_sqm,has_parking,has_balcony,is_furnished,is_rfo,selling_price').eq('id', row.project_unit_id).maybeSingle()
      : Promise.resolve({ data: null }),
    row.developer_id
      ? admin.from('developers_profiles').select('id,developer_name,logo_url').eq('id', row.developer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('property_listing_galleries').select('id,listing_id,image_url,display_order').eq('listing_id', id).order('display_order', { ascending: true }),
    row.user_profile_id
      ? admin.from('user_profiles').select('id,profile_image_url,full_name,role').eq('id', row.user_profile_id).maybeSingle()
      : Promise.resolve({ data: null }),
    row.project_id
      ? admin.from('project_amenities').select('project_id,amenity_id').eq('project_id', row.project_id)
      : Promise.resolve({ data: [] })
  ])

  let amenities: { name: string; icon: string | null }[] = []
  if (projectAmenitiesResult.data && projectAmenitiesResult.data.length > 0) {
    const amenityIds = projectAmenitiesResult.data.map(a => a.amenity_id)
    const { data: amenityRows } = await admin.from('amenities').select('name,icon').in('id', amenityIds)
    amenities = (amenityRows || []).map(a => ({ name: a.name, icon: a.icon ?? null }))
  }

  const project = projectResult.data
  const developer = developerResult.data || (project?.developer_id ? (await admin.from('developers_profiles').select('developer_name, logo_url').eq('id', project.developer_id).maybeSingle()).data : null)

  // Fetch agent contact info
  let agentContact: { email: string | null; phone: string | null } = { email: null, phone: null }
  if (row.user_profile_id) {
    const { data: contactRow } = await admin
      .from('contact_information')
      .select('email,primary_mobile')
      .eq('user_profile_id', row.user_profile_id)
      .maybeSingle()
    if (contactRow) {
      agentContact = { email: contactRow.email, phone: contactRow.primary_mobile }
    }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    listing_type: row.listing_type,
    status: row.status,
    currency: row.currency,
    price: row.price,
    negotiable: row.negotiable,
    is_featured: row.is_featured,
    created_at: row.created_at,
    developers_profiles: developer ? { developer_name: developer.developer_name, logo_url: developer.logo_url } : null,
    user_profiles: userProfileResult.data ? { profile_image_url: userProfileResult.data.profile_image_url } : null,
    projects: project ? {
      id: project.id,
      name: project.name,
      slug: project.slug,
      city_municipality: project.city_municipality,
      province: project.province,
      barangay: project.barangay,
      region: project.region,
      project_type: project.project_type,
      classification: project.classification,
      main_image_url: project.main_image_url
    } : null,
    project_units: unitResult.data ? {
      id: unitResult.data.id,
      project_id: unitResult.data.project_id,
      unit_name: unitResult.data.unit_name,
      unit_type: unitResult.data.unit_type,
      bedrooms: unitResult.data.bedrooms,
      bathrooms: unitResult.data.bathrooms,
      floor_area_sqm: unitResult.data.floor_area_sqm,
      lot_area_sqm: unitResult.data.lot_area_sqm,
      has_parking: unitResult.data.has_parking,
      has_balcony: unitResult.data.has_balcony,
      is_furnished: unitResult.data.is_furnished,
      is_rfo: unitResult.data.is_rfo,
      selling_price: unitResult.data.selling_price
    } : null,
    property_listing_galleries: galleryResult.data || [],
    project_amenities: amenities,
    agent: userProfileResult.data ? {
      full_name: userProfileResult.data.full_name ?? null,
      profile_image_url: userProfileResult.data.profile_image_url ?? null,
      email: agentContact.email,
      phone: agentContact.phone,
      role: userProfileResult.data.role ?? null,
    } : null,
  } as any
}

export async function getRecommendedListings(currentId: number, projectId: number | null, limit = 3): Promise<PublicListingSearchRecord[]> {
  const admin = createAdminSupabaseClient()

  let query = admin
    .from('property_listings')
    .select('id,title,description,listing_type,status,currency,price,negotiable,is_featured,created_at,developer_id,project_id,project_unit_id,user_profile_id')
    .eq('status', 'published')
    .neq('id', currentId)
    .limit(limit)

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data: rows } = await query.order('created_at', { ascending: false })
  if (!rows || rows.length === 0) return []

  const results: PublicListingSearchRecord[] = []
  for (const row of rows) {
    const [unitRes, galleryRes] = await Promise.all([
      row.project_unit_id
        ? admin.from('project_units').select('id,project_id,unit_name,unit_type,bedrooms,bathrooms,floor_area_sqm,lot_area_sqm,has_parking,has_balcony,is_furnished,is_rfo,selling_price').eq('id', row.project_unit_id).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.from('property_listing_galleries').select('id,listing_id,image_url,display_order').eq('listing_id', row.id).order('display_order', { ascending: true }).limit(1),
    ])

    let projData = null
    if (row.project_id) {
      const { data } = await admin.from('projects').select('id,developer_id,name,slug,city_municipality,province,barangay,region,project_type,classification,main_image_url').eq('id', row.project_id).maybeSingle()
      projData = data
    }

    let devData = null
    if (row.developer_id) {
      const { data } = await admin.from('developers_profiles').select('developer_name,logo_url').eq('id', row.developer_id).maybeSingle()
      devData = data
    } else if (projData?.developer_id) {
      const { data } = await admin.from('developers_profiles').select('developer_name,logo_url').eq('id', projData.developer_id).maybeSingle()
      devData = data
    }

    results.push({
      id: row.id,
      title: row.title,
      description: row.description,
      listing_type: row.listing_type,
      status: row.status,
      currency: row.currency,
      price: row.price,
      negotiable: row.negotiable,
      is_featured: row.is_featured,
      created_at: row.created_at,
      developers_profiles: devData ? { developer_name: devData.developer_name, logo_url: devData.logo_url } : null,
      user_profiles: null,
      projects: projData ? {
        id: projData.id,
        name: projData.name,
        slug: projData.slug,
        city_municipality: projData.city_municipality,
        province: projData.province,
        barangay: projData.barangay,
        region: projData.region,
        project_type: projData.project_type,
        classification: projData.classification,
        main_image_url: projData.main_image_url,
      } : null,
      project_units: unitRes.data ? {
        id: unitRes.data.id,
        project_id: unitRes.data.project_id,
        unit_name: unitRes.data.unit_name,
        unit_type: unitRes.data.unit_type,
        bedrooms: unitRes.data.bedrooms,
        bathrooms: unitRes.data.bathrooms,
        floor_area_sqm: unitRes.data.floor_area_sqm,
        lot_area_sqm: unitRes.data.lot_area_sqm,
        has_parking: unitRes.data.has_parking,
        has_balcony: unitRes.data.has_balcony,
        is_furnished: unitRes.data.is_furnished,
        is_rfo: unitRes.data.is_rfo,
        selling_price: unitRes.data.selling_price,
      } : null,
      property_listing_galleries: galleryRes.data || [],
      project_amenities: [],
    })
  }
  return results
}

export async function getListingBySlug(
  listingMode: ListingSearchMode,
  slug: string,
  locationSlug?: string | null
): Promise<PublicListingSearchRecord | null> {
  const { listings } = await searchPublicListings(
    listingMode,
    locationSlug ? { location: locationSlug } : {}
  )

  const matched = listings.find((listing) => toListingSlug(listing.title, listing.id) === slug)
  if (!matched) return null

  return getListingById(matched.id)
}
